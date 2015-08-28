var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Cheerio = require('cheerio');
var Auth = require('hapi-auth-cookie');
var Hoek = require('hoek');
var Config = require('../lib/config');
var Follower = require('../');
var GenerateCrumb = require('./generate-crumb');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/home', function () {

  it('ensures that /home is always redirected to https', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = { method: 'GET', url: '/home' };
      server.select('web').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(301);
        expect(res.headers.location).to.equal('https://localhost:8001/home');

        server.stop(done);
      });
    });
  });

  it('returns the home page via https', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = { method: 'GET', url: '/home' };
      server.select('web-tls').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(200);

        server.stop(done);
      });
    });
  });

  it('logged in user info is displayed', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      GenerateCrumb(server, true).then(function (request) {

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username).to.equal('foo');

          var header = res.headers['set-cookie'];
          expect(header.length).to.equal(1);
          expect(header[0]).to.contain('Max-Age=60');

          var cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);

          // ./home greets authenticated user

          var request2 = {
            method: 'GET',
            url: '/home',
            headers: {
              cookie: 'followers-api='+cookie[1]
            }
          };

          server.select('web-tls').inject(request2, function (res2) {

            var $ = Cheerio.load(res2.result);
            var result = ($('h1', 'body').text());

            expect(result).to.equal('Foo Foo');

            server.stop(done);
          });
        });
      });
    });
  });
});

describe('./account', function () {

  it('logged in (admin) user accesses /account page', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      GenerateCrumb(server, true).then(function (request) {

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username).to.equal('foo');

          var header = res.headers['set-cookie'];
          expect(header.length).to.equal(1);

          expect(header[0]).to.contain('Max-Age=60');
          var cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);

          // ./home greets authenticated user

          var request2 = {
            method: 'GET',
            url: '/account',
            headers: {
              cookie: 'followers-api='+cookie[1]
            }
          };

          server.select('web-tls').inject(request2, function (res2) {

            var $ = Cheerio.load(res2.result);
            var result = ($('h3', 'body').text());

            expect(result).to.equal('Foo Foo Account');

            server.stop(done);
          });
        });
      });
    });
  });

  it('logged in (admin) user accesses /admin page', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      GenerateCrumb(server, true).then(function (request) {

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username).to.equal('foo');

          var header = res.headers['set-cookie'];
          expect(header.length).to.equal(1);

          expect(header[0]).to.contain('Max-Age=60');
          var cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);

          // ./home greets authenticated user

          var request2 = {
            method: 'GET',
            url: '/admin',
            headers: {
              cookie: 'followers-api='+cookie[1]
            }
          };

          server.select('web-tls').inject(request2, function (res2) {

            var $ = Cheerio.load(res2.result);
            var result = ($('h3', 'body').text());

            expect(result).to.equal('Success, you accessed the admin page!');

            server.stop(done);
          });
        });
      });
    });
  });

  it('logged in (NON-admin) user accesses /account page', function (done) {

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
            url: '/account',
            headers: {
              cookie: 'followers-api='+cookie[1]
            }
          };

          server.select('web-tls').inject(request2, function (res2) {

            var $ = Cheerio.load(res2.result);
            var result = ($('h3', 'body').text());

            expect(result).to.equal('Bar Head Account');

            server.stop(done);
          });
        });
      });
    });
  });
});

describe('hapi-auth-cookie tests', function () {

  it('errors on failed registering of auth-cookie', {parallel: false}, function (done) {

    var orig = Auth.register;

    Auth.register = function (plugin, options, next) {

      Auth.register = orig;
      return next(new Error('fail'));
    };

    Auth.register.attributes = {
      name: 'fake hapi-auth-cookie'
    };

    Follower.init(internals.manifest, internals.composeOptions, function (err) {

      expect(err).to.exist();

      done();
    });
  });

  it('errors on missing Auth cookie plugin', function (done) {

    var manifest = Hoek.clone(internals.manifest);
    delete manifest.plugins['./auth-cookie'];

    var failingInit = Follower.init.bind(Follower, manifest, internals.composeOptions, function (err) {

      expect(err).to.exist();
      done();
    });

    expect(failingInit).to.throw();

    done();
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

