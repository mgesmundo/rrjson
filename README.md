# rrjson

An easier JSON stringify and parse with reviver and replacer to preserve Error, Date, Array, RegExp and custom Object instances. It works both in Node and browser.

## Motivation

If you try to stringify an Error instance and to parse back, you obtain an empty object:

```javascript
console.log(JSON.parse(JSON.stringify(new Error('my message'))) instanceof Error);
// false
```

Using this module:

```javascript
var rrjson = require('rrjson');
rrjson.add('Error');
console.log(rrjson.parse(rrjson.stringify(new Error('my message'))) instanceof Error);
// true
```

## Limitations

Is not possible to recreate an instance of a custom object if it requires some mandatory parameter. The internal state (private members) of the recreated object is wrong if is not provided a function to save and restore it.
The function used to create the object instance MUST have a name for his constructor:

    function MyBaseClass() {
        // ...
    }
    // this object can recreated using strinfigy and parse
    var obj = new MyBaseClass();

    var MyBaseClass = function () {
        // ...
    };
    // this object can't recreated using strinfigy and parse
    var obj = new MyBaseClass();


## Installation

Install `rrjson` as usual:

    $ npm install --save rrjson

## Usage

The usage is simple. See the example below.

```javascript
var rrjson = require('rrjson');
// create context (or use context of your module)
var context = {
  Actor: function Actor(name) {
    this.name = name;
  },
  Director: function Actor(name, actors) {
    this.name = name;
    this.actors = actors;
  }
};
// customize rrjson
rrjson.add('Error');
rrjson.add('Actor', 'Director', context);
// create object to stringify
var actor = new context.Actor('Tom Cruise');
// recreate object
var actor_revived = rrjson.parse(rrjson.stringify(actor));
// the object is an instance of the class
console.log(actor_revived instanceof context.Actor); // true
```

# Test

To start the test suite simply type:

    $ npm test

## Convention

The version number is laid out as: major.minor.patch and tries to follow semver as closely as possible but this is how we use our version numbering:

#### major
A major and possible breaking change has been made in the authorify core. These changes could be not backwards compatible with older versions.

#### minor
New features are added or a big change has happened with one of the third party libraries.

#### patch
A bug has been fixed, without any major internal and breaking changes.

# Contributing

To contribute to the project follow the [GitHub guidelines][8].

# License

Copyright (c) 2014 Yoovant by Marcello Gesmundo. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

   * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
   * Neither the name of Yoovant nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

[1]: https://www.npmjs.org/package/primus-callbacks