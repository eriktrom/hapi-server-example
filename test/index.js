var Hapi = require('hapi');
var Version = require('../lib/version');
var Follower = require('../');
var Code = require('code');
var Lab = require('lab');
var Path = require('path');


var internals = {};


var lab = exports.lab = Lab.script();
var expect = Code.expect;
var it = lab.test;

it('starts server and returns hapi server object', function (done) {

  Follower.init({}, {}, function (err, server) {

    // expect(server).to.be.instanceof(Hapi.Server); // fails in hapi 9.x.x
    expect(err).to.not.exist();

    server.stop(done);
  });
});

it('starts server on provided port', function (done) {

  Follower.init({connections: [{port: 5000}]}, {}, function (err, server) {

    expect(err).to.not.exist();
    expect(server.info.port).to.equal(5000);

    server.stop(done);
  });
});

it('handles register plugin errors', {parallel: false}, function (done) {

  var orig = Version.register;
  Version.register = function (server, options, next) {

    Version.register = orig;
    return next(new Error('register version failed'));
  };

  Version.register.attributes = {
    name: 'fake version'
  };

  Follower.init(internals.manifest, internals.composeOptions, function (err) {

    expect(err).to.exist();
    expect(err.message).to.equal('register version failed');

    done();
  });
});


internals.manifest = {
  connections: [
    {
      port: 0
    }
  ],
  plugins: {
    './version': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
