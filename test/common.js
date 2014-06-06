/*global describe, it, before, after, beforeEach */

describe('RRJSON', function() {
  beforeEach(function(){
    rrjson = rrjson.create();
  });
  it('should add Error type as string', function(done) {
    rrjson.add('Error');
    rrjson.types.should.have.property('Error');
    done();
  });
  it('should add RegExp type as array', function(done) {
    rrjson.add('RegExp');
    rrjson.types.should.have.property('RegExp');
    done();
  });
  it('should add two custom Object types as array and context', function(done) {
    var context = {};
    rrjson.add(['Actor', ['Director', context]], context);
    rrjson.types.should.have.property('Actor');
    rrjson.types.Actor.should.eql(context);
    rrjson.types.should.have.property('Director');
    rrjson.types.Director.should.eql(context);
    done();
  });
  it('should add two types as array of strings', function(done) {
    var r = rrjson.create();
    r.add(['Date', 'Array']);
    r.types.should.have.property('Date');
    r.types.should.have.property('Array');
    done();
  });
  it('should add two types as strings and context', function(done) {
    var context = {};
    var r = rrjson.create();
    r.add('Date', 'Array', 'Actor', context);
    r.types.should.have.property('Date');
    r.types.Date.should.eql(context);
    r.types.should.have.property('Array');
    r.types.Array.should.eql(context);
    r.types.should.have.property('Actor');
    r.types.Actor.should.eql(context);
    done();
  });
  it('should recreate Array', function(done) {
    var r = rrjson.create();
    r.add('Array');
    var source = [1, 2, 3];
    var dest = r.parse(r.stringify(source));
    dest.should.be.eql(source);
    dest.should.be.an.instanceOf(Array);
    done();
  });
  it('should recreate Date', function(done) {
    var r = rrjson.create();
    r.add('Date');
    var source = new Date();
    var dest = r.parse(r.stringify(source));
    dest.should.be.eql(source);
    dest.should.be.an.instanceOf(Date);
    done();
  });
  it('should recreate RegExp', function(done) {
    var r = rrjson.create();
    r.add('RegExp');
    var source = new RegExp();
    var dest = r.parse(r.stringify(source));
    dest.should.be.eql(source);
    dest.should.be.an.instanceOf(RegExp);
    done();
  });
  it('should recreate Error', function(done) {
    var r = rrjson.create();
    r.add('Error');
    var source = { err: new Error('custom error')};
    var dest = r.parse(r.stringify(source));
    dest.err.message.should.be.eql(source.err.message);
    dest.err.should.be.an.instanceOf(Error);
    done();
  });
  it('should recreate complex object', function(done) {
    var r = rrjson.create();
    r.add('Error', 'Array');
    var source = {
      err: new Error('custom error'),
      headers: [
        {'authorization': 'auht'},
        {'cors': 'true'}
      ],
      body: {
        query: {
          values: [
            'opt1 = 1',
            'opt2 = 2',
            {
              foo: 'bar'
            }
          ]
        }
      }
    };
    var dest = r.parse(r.stringify(source));
    dest.err.message.should.be.eql(source.err.message);
    dest.headers.should.be.eql(source.headers);
    dest.body.should.be.eql(source.body);
    done();
  });
  it('should recreate custom object', function(done) {
    var context = {
      Actor: function Actor(name) {
        this.name = name;
      }
    };
    var r = rrjson.create();
    var className = 'Actor';
    r.add(className);
    r.add('Actor', context);
    r.isSet(className).should.true;
    var source = { actor: new context.Actor('Tom Cruise'), info: { age: 51 } };
    var dest = r.parse(r.stringify(source));
    dest.should.be.eql(source);
    dest.actor.should.be.an.instanceOf(context[className]);
    done();
  });
});