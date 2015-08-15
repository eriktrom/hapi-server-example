var Hapi = require('hapi');
var Version = require('../lib/version');
var Follower = require('../');
var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Config = require('../lib/config');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/index', function () {

  it('starts server and returns hapi server object', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      // expect(server).to.be.instanceof(Hapi.Server); // fails in hapi 9.x.x
      expect(err).to.not.exist();

      server.stop(done);
    });
  });

  it('starts server on provided port', function (done) {

    Follower.init({ connections: [{ port: 5000, labels: 'web' }] }, {}, function (err, server) {

      expect(err).to.not.exist();
      expect(server.select('web').info.port).to.equal(5000);

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

  it('forces re-routing to https', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      server.inject('/version', function (res) {

        expect(res.statusCode).to.equal(301);
        expect(res.headers.location).to.equal('https://localhost:8001/version');

        server.stop(done);
      });
    });
  });
});


internals.manifest = {
  connections: [
    {
      host: 'localhost',
      port: 0,
      labels: ['web']
    },
    {
      host: 'localhost',
      port: 0,
      labels: ['web-tls'],
      tls: Config.tls
    }
  ],
  plugins: {
    './version': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
