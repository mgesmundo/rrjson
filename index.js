/**
 * Copyright (c) 2014 Yoovant by Marcello Gesmundo. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 *      copyright notice, this list of conditions and the following
 *      disclaimer in the documentation and/or other materials provided
 *      with the distribution.
 *    * Neither the name of Yoovant nor the names of its
 *      contributors may be used to endorse or promote products derived
 *      from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function rrjson(){
  Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
      var alt = {
        __isError__: true
      };
      Object.getOwnPropertyNames(this).forEach(function (key) {
        alt[key] = this[key];
      }, this);
      return alt;
    },
    configurable: true
  });

  var reRFC3339 = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)?(:)?(\d\d)?([\.,]\d+)?($|Z|([+-])(\d\d)(:)?(\d\d)?)/i;

  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }

  function isArray(ar) {
    return Array.isArray(ar);
  }

  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }

  function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
  }

  function isObject(arg) {
    return typeof arg === 'object' && arg && !isArray(arg);
  }

  function isDate(d) {
    return (isObject(d) && objectToString(d) === '[object Date]') ||
      (isString(d) && d.match(new RegExp(reRFC3339)));
  }


  function isNativeError(e) {
    return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
  }

  function isError(e) {
    return isNativeError(e) || (isObject(e) && e.hasOwnProperty('__isError__'));
  }

  function isString(arg) {
    return typeof arg === 'string';
  }

  function serialize(regExp) {
    var flags = '';
    if (regExp.global) flags += 'g';
    if (regExp.multiline) flags += 'm';
    if (regExp.ignoreCase) flags += 'i';
    return [regExp.source, flags];
  }

  function reviveError(source) {
    return safeClone(source, new Error());
  }

  function safeClone(source, dest) {
    if (isObject(source)) {
      dest = dest || {};
      var _source = source;
      if (isNativeError(source) && !isNativeError(dest)) {
        reviveError(source);
      }
      var key, value;
      for (key in _source) {
        if (_source.hasOwnProperty(key)) {
          value = _source[key];
          if (isObject(value)) {
            dest[key] = safeClone(value, dest[key]);
          } else {
            dest[key] = value;
          }
        }
      }
    } else {
      dest = source;
    }
    return dest;
  }

  function stringOrArrayInObject(dest, type, ctx) {
    if (isArray(dest) || isString(dest)) {
      ctx = type;
      type = dest;
      dest = {};
    }
    if (!isObject(dest)) {
      throw new Error('destination must be an object');
    }
    if (isArray(type)) {
      type.forEach(function(t) {
        switch (t.length) {
          case 2:
            dest[type] = t[1] || ctx;
            break;
          case 1:
            dest[type] = ctx;
            break;
          default :
            throw new Error('wrong array length');
            break;
        }
      });
    } else if (isString(type)) {
      if (type.length = 0) {
        throw new Error('empty string');
      }
      dest[type] = ctx;
    } else {
      throw new Error('wrong type: only array and string allowed');
    }
    return dest;
  }

  function RRJSON(opts) {
    opts = opts || {};
    this.prefixType  = '_t_'    || opts.prefixType;
    this.prefixValue = '_v_'    || opts.prefixValue;
    this.noStack = opts.noStack || true;
    this.types = {};
  }

  /**
   * Create a new RRJSON instance
   *
   * @param {Object} opts The options
   * @return {RRJSON} The new instance
   */
  RRJSON.prototype.create = function create(opts) {
    return new RRJSON(opts);
  };
  /**
   * Add one (or more) class name and his (optional) context for recreation.
   * The context is not applied to Error, RegExp, Array and Date.
   *
   * # Example
   *
   *    rrjson.add('Error');
   *    rrjson.add('Actor', exports);
   *    rrjson.add(['Actor', 'Director'], exports);
   *    rrjson.add('Error', 'Date', 'Actor', exports);
   *    rrhson.add(['Actor', module1]);
   *    rrhson.add([['Actor', module1], ['Director]], module2);
   *
   * @param {String/Array/...} type The type(s) name(s) to add.
   * If type is an Array it must have two elements: [{String} type, {Object} context]
   * @param {Object} [ctx] The default (optional) context (last parameter).
   */
  RRJSON.prototype.add = function add() {
    var dest = this.types;
      var args = Array.prototype.slice.call(arguments);
      if (args.length === 0) {
        throw new Error('nothing to add');
      }
      var ctx = args[args.length - 1];
      if (!isObject(ctx)) {
        ctx = undefined;
      }
      args.forEach(function(type, idx) {
        if (idx < args.length - 1 || ctx === undefined) {
          if (isArray(type)) {
            type.forEach(function(t) {
              if (isArray(t)) {
                if (t.length === 0 || t.length > 2) {
                  throw new Error('wrong array length');
                }
                if (!isString(t[0])) {
                  throw new Error('wrong type: only string allowed');
                }
                switch (t.length) {
                  case 2:
                    dest[t[0]] = t[1] || ctx;
                    break;
                  default :
                    dest[t[0]] = ctx;
                    break;
                }
              } else if (isString(t)) {
                dest[t] = ctx;
              } else {
                throw new Error('wrong type: only array and string allowed');
              }
            });
          } else if (isString(type)) {
            if (type.length = 0) {
              throw new Error('empty string');
            }
            dest[type] = ctx;
          } else {
            throw new Error('wrong type: only array and string allowed');
          }
        }
      });
//    }
  };

  /**
   * Remove a type for the recreation
   *
   * @param {String} type The type name
   */
  RRJSON.prototype.remove = function remove(type) {
    delete this.types[type];
  };

  /**
   * Check if a type is set for the recreation
   *
   * @param {String} type The type name
   * @return {Boolean} True if the type can be recreated
   */
  RRJSON.prototype.isSet = function isSet(type) {
    return this.types.hasOwnProperty(type);
  };

  /**
   * Get the context for the type object recreation
   * @param type The type name
   * @return {Object} The context for the recreation
   */
  RRJSON.prototype.getContext = function getContext(type) {
    return (this.isSet(type) ? this.types[type] : null);
  };

  /**
   * Get the constructor name
   * @param {Object} obj The object
   * @return {String} The name of the constructor
   */
  function getName(obj) {
    var name;
    if (isObject(obj)) {
      if (obj && obj.constructor && obj.constructor.name) {
        name = obj.constructor.name;
        if (name !== 'Function' && name !== '' && name !== 'undefined') {
          return name;
        }
      }
    }
    return name;
  }

  function toBeReplaced(source) {
    if (isError(source) && this.isSet('Error')) {
      return 'Error';
    }
    if (isArray(source) && this.isSet('Array')) {
      return 'Array';
    }
    if (isDate(source) && this.isSet('Date')) {
      return 'Date';
    }
    if (isRegExp(source) && this.isSet('RegExp')) {
      return 'RegExp';
    }
    var name = getName(source);
    if (name && this.isSet(name)) {
      return name;
    }
    return false;
  }

  function getReplacer(serializer) {
    var self = this;
    function replacer(key, value) {
      if (key !== self.prefixType && key !== self.prefixValue) {
        var type = toBeReplaced.call(self, value);
        var _value = {};
        _value[self.prefixType] = type;
        if (type) {
          switch (type) {
            case 'Error':
              delete value.__isError__;
              if (self.noStack) {
                delete value.stack;
              }
              _value[self.prefixValue] = JSON.stringify(value, serializer);
              value = _value;
              break;
            case 'Array':
            case 'Date':
              _value[self.prefixValue] = JSON.stringify(value, serializer);
              value = _value;
              break;
            case 'RegExp':
              _value[self.prefixValue] = JSON.stringify(serialize(value), serializer);
              value = _value;
              break;
            default :
              if (type !== 'Object' && self.isSet(type)) {
                _value[self.prefixValue] = JSON.stringify(value, serializer);
                value = _value;
              }
              break;
          }
          return value;
        }
      }
      return value;
    }
    return replacer;
  }

  function getReviver(deserializer) {
    var self = this;
    function reviver(key, value) {
      if (key !== self.prefixType && key !== self.prefixValue && value && isObject(value)) {
        if (value.hasOwnProperty(self.prefixType) && value.hasOwnProperty(self.prefixValue)) {
          var type = value[self.prefixType];
          var _value;
          switch (type) {
            case 'Error':
              _value = value[self.prefixValue];
              _value = JSON.parse(_value, deserializer);
              value = reviveError(_value);
              break;
            case 'Array':
              _value = value[self.prefixValue];
              value = [].concat(JSON.parse(_value, deserializer));
              break;
            case 'Date':
              _value = value[self.prefixValue];
              value = new Date(JSON.parse(_value, deserializer));
              break;
            case 'RegExp':
              _value = value[self.prefixValue];
              _value = JSON.parse(_value, deserializer);
              value = new RegExp(_value[0], _value[1]);
              break;
            default :
              if (type !== 'Object' && self.isSet(type)) {
                _value = value[self.prefixValue];
                _value = JSON.parse(_value, deserializer);
                var ctx = self.getContext(type);
                if (ctx) {
                  var instance = new ctx[type]();
                  _value = safeClone(_value, instance);
                }
                value = _value;
              }
              break;
          }
        }
      }
      return value;
    }
    return reviver;
  }

  /**
   * The stringify method
   *
   * @param {Object} obj The object to stringify
   * @param {Function} [serializer] The optional replacer function (see http://www.json.org/js.html)
   * @return {String} The serialized object
   */
  RRJSON.prototype.stringify = function stringify(obj, serializer) {
    return JSON.stringify(obj, getReplacer.call(this, serializer));
  };

  /**
   * The reverse of stringify method
   * @param {String} str The string to parse
   * @param {Function} [deserializer] The optional reviver function (see http://www.json.org/js.html)
   * @return {Object} The deserialized object
   */
  RRJSON.prototype.parse = function parse(str, deserializer) {
    return JSON.parse(str, getReviver.call(this, deserializer));
  };

  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = new RRJSON();
  } else {
    this.rrjson = new RRJSON();
  }
})();
