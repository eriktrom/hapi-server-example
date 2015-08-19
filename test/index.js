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

    Follower.init({ connections: [{ port: 5000, labels: ['web', 'web-tls', 'api'] }] }, {}, function (err, server) {

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

describe('server.ext() request cycle handles', function() {

  it('bad route entered', function(done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      server.select('web-tls').inject('/wakawaka', function(res) {

        expect(res.statusCode).to.equal(301);
        expect(res.headers.location).to.equal('https://localhost:8001/home');

        server.stop(done);
      });
    });
  });

  it('insufficient scope for user web-tls', function(done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'POST',
        url: '/login',
        payload: internals.loginCredentials('bar', 'bar')
      };

      // Successfull Login

      internals.server = server;

      internals.server.select('api').inject(request, function(res) {

        expect(res.statusCode, 'Status code').to.equal(200);
        expect(res.result.username).to.equal('Bar Head');

        var header = res.headers['set-cookie'];
        expect(header.length).to.equal(1);

        expect(header[0]).to.contain('Max-Age=60');

        internals.cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);


        // ./home greets authenticated user

        var request2 = {
          method: 'GET',
          url: '/admin',
          headers: {
            cookie: 'followers-api=' + internals.cookie[1]
          }
        };

        internals.server.select('web-tls').inject(request2, function(res) {

          expect(res.statusCode, 'Status code').to.equal(301);
          expect(res.headers.location).to.equal('https://localhost:8001/home');
          internals.server.stop(done);
        });
      });
    });
  });

  it('insufficient scope public user web-tls', function(done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/admin'
      };

      // Successfull Login

      internals.server = server;

      internals.server.select('web-tls').inject(request, function(res) {

        expect(res.statusCode, 'Status code').to.equal(302);
        expect(res.headers.location).to.equal('/login');
        internals.server.stop(done);
      });
    });
  });

  it('joi validation error transformed', function(done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      expect(err).to.not.exist();


      internals.server = server;


      var request = {
        method: 'POST',
        url: '/login',
        payload: internals.loginCredentials('foowakawaka', 'bamo')
      }; // This fails loggin in event w. correct credentials..

      internals.server.select('api').inject(request, function(res) {

        expect(res.statusCode, 'Status code').to.equal(400);
        expect(res.result.message).to.equal('Malformed Data Entered');
        internals.server.stop(done);
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
      labels: ['web-tls', 'api'],
      tls: Config.tls
    }
  ],
  plugins: {
    './version': {},
    './home': [{
      'select': ['web', 'web-tls']
    }],
    './api/login': [{
      'select': ['api']
    }],
    './auth-cookie': {},
    'hapi-auth-cookie': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};

internals.loginCredentials = function(username, password) {

  return JSON.stringify({
    username: username,
    password: password
  });
};
