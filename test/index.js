var Version = require('../lib/version');
var Follower = require('../');
var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Config = require('../lib/config');
var GenerateCrumb = require('./generate-crumb');


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

  it('starts server on port provided by manifest', function (done) {

    var manifest = {
      connections: [{
        port: 5000,
        labels: ['web', 'web-tls', 'api']
      }],
      plugins: {
        'vision': {}
      }
    };

    var composeOptions = {};

    Follower.init(manifest, composeOptions, function (err, server) {

      expect(err).to.not.exist();
      expect(server.select('web').info.port).to.equal(5000);
      expect(server.select('web-tls').info.port).to.equal(5000);
      expect(server.select('api').info.port).to.equal(5000);

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

describe('server.ext() request cycle handles', function () {

  it('entering an unhandled route redirectes to /home', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      server.select('web-tls').inject('/wakawaka', function (res) {

        expect(res.statusCode).to.equal(301);
        expect(res.headers.location).to.equal('https://localhost:8001/home');

        server.stop(done);
      });
    });
  });

  it('visiting /admin as a non admin user redirects to /home', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      GenerateCrumb(server, {username: 'bar', password: 'bar'}).then(function (request) {

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username).to.equal('bar');

          var header = res.headers['set-cookie'];
          expect(header.length).to.equal(1);

          expect(header[0]).to.contain('Max-Age=60');

          var cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);

          // ./home greets authenticated user

          var request2 = {
            method: 'GET',
            url: '/admin',
            headers: {
              cookie: 'followers-api=' + cookie[1]
            }
          };

          server.select('web-tls').inject(request2, function (res2) {

            expect(res2.statusCode, 'Status code').to.equal(301);
            expect(res2.headers.location).to.equal('https://localhost:8001/home');
            server.stop(done);
          });
        });
      });
    });
  });

  it('visiting /admin as a non authenticated user redirects /home', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/admin'
      };

      // Successfull Login

      server.select('web-tls').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(302);
        expect(res.headers.location).to.equal('/login');
        server.stop(done);
      });
    });
  });

  it('should return 401 Not Found when attempting to login w/ bad u/p even when user is already authenticated via crumb cookie', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      GenerateCrumb(server, true).then(function (request) {

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);

          var header = res.headers['set-cookie'];
          expect(header.length).to.equal(1);
          expect(header[0]).to.contain('Max-Age=60');
          var cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);

          var request2 = {
            method: 'POST',
            url: '/login',
            payload: { username: 'bogus', password: 'more bogus' },
            headers: {
              cookie: 'followers-api=' + cookie[1]
            }
          };

          server.select('api').inject(request2, function (res2) {

            expect(res2.statusCode, 'Status code').to.equal(401);
            expect(res2.result.message).to.equal(Config.genericLoginErrorMsg);

            server.stop(done);
          });
        });
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
    'hapi-auth-cookie': {},
    'crumb': Config.crumb,
    'vision': {},
    'visionary': {
      'engines': { 'html': 'handlebars' },
      'path': '../views',
      relativeTo: __dirname
    },
    'inert': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
