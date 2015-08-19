var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Cheerio = require('cheerio');
var Config = require('../../lib/config');
var Follower = require('../../');
var GenerateCrumb = require('../generate-crumb');

var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/login', function() {

  it('access login page', function(done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      var request1 = {
        method: 'GET',
        url: '/login'
      };

      server.select('web-tls').inject(request1, function(res) {

        // expect(res.result).to.equal('foofoo');

        expect(res.statusCode, 'Status code').to.equal(200);

        server.stop(done);
      });
    });
  });

  it('successful login', function(done) {
    //  *****  HELPS  *****
    //  Helpful links to build out crumb tests
    //  https://github.com/npm/newww/blob/2bc02c7558c7a3b8bdb34858ff99cd77d7c7c06a/test/handlers/crumb.js
    //  https://github.com/npm/newww/blob/2bc02c7558c7a3b8bdb34858ff99cd77d7c7c06a/test/handlers/user/login.js
    //  https://github.com/npm/newww/blob/master/routes/public.js

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      expect(err).to.not.exist();

      // Successfull Login

      GenerateCrumb(server, true).then(function (request) {

        server.select('api').inject(request, function(res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username).to.equal('Foo Foo');

          var header = res.headers['set-cookie'];
          expect(header.length).to.equal(1);

          expect(header[0]).to.contain('Max-Age=60');

          internals.cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);


          // ./home greets authenticated user

          var request2 = {
            method: 'GET',
            url: '/home',
            headers: {
              cookie: 'followers-api=' + internals.cookie[1]
            }
          };

          server.select('web-tls').inject(request2, function(res) {

            var $ = Cheerio.load(res.result);
            var result = ($('h1', 'body').text());

            expect(result).to.equal('Foo Foo');


            // ./login GET redirects to account if already logged in.


            var request3 = {
              method: 'GET',
              url: '/login',
              headers: {
                cookie: 'followers-api=' + internals.cookie[1]
              }
            };

            server.select('web-tls').inject(request3, function(res) {

              expect(res.statusCode, 'Status code').to.equal(302); // redirected
              expect(res.headers.location).to.include('/account');

              server.stop(done);
            });
          });
        });
      });
    });
  });

  it('test crumb and not much else', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      GenerateCrumb(server, true).then(function (request) {

        var crumb = request.payload.crumb;
        var cookie = request.headers.cookie;

        expect(crumb).string().length(43);
        expect(cookie).to.equal('crumb='+crumb);

        server.select('api').inject(request, function (res) {

          expect(res.statusCode).to.equal(200);

          server.stop(done);
        });
      });
    });
  });


  // @todo  split below into tests

  it('Cookie auth login fails - b/c NO crumb', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {
      var request = {
        method: 'POST',
        url: '/login',
        payload: { username: 'foo', password: 'foo' }
      };

      server.select('web-tls').inject(request, function(res) {

        expect(res.statusCode, 'Status code').to.equal(403);
        expect(res.result.error).to.equal('Forbidden');
        expect(res.result.message).to.equal('What Are You Doing!!!');

        server.stop(done);
      });
    });
  });

  it('Cookie auth login fails - with bad password', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      GenerateCrumb(server, {username: 'foo', password: 'blah'}).then(function (request) {

        server.select('web-tls').inject(request, function(res) {

          expect(res.statusCode, 'Status code').to.equal(401);
          expect(res.result.message).to.equal('Invalid password or username');

          server.stop(done);
        });
      });
    });
  });

  it('Cookie auth login succeeds - with good password & username', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      expect(err).to.not.exist();

      GenerateCrumb(server, true).then(function (request) {

        server.select('web-tls').inject(request, function(res) {

          expect(res.statusCode, 'Status code').to.equal(200);

          server.stop(done);
        });
      });
    });
  });
});

describe('/logout', function() {

  it('Ensure logout works', function(done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      expect(err).to.not.exist();

      GenerateCrumb(server, true).then(function (request) {

        server.select('web-tls').inject(request, function(res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          // // expect(res.result.username).to.equal('Foo Foo');

          var header = res.headers['set-cookie'];
          expect(header.length).to.equal(1);

          expect(header[0]).to.contain('Max-Age=60');
          var cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);

          var request2 = {
            method: 'POST',
            url: '/logout',
            payload: request.payload,
            headers: request.headers
          };
          server.select('web-tls').inject(request2, function(res) {


            expect(res.statusCode, 'Status code').to.equal(302);
            expect(res.headers.location).to.equal('/login');

            server.stop(done);
          });
        });
      });
    });
  });

  it('unregistered user tried to access restricted ./logout on api', function(done) {

    Follower.init(internals.manifest, internals.composeOptions, function(err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'POST',
        url: '/logout'
      };

      // Successfull Login
      server.select('api').inject(request, function(res) {

        expect(res.statusCode, 'Status code').to.equal(302);
        expect(res.headers.location).to.equal('/login');

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
    'crumb': Config.crumb
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../../lib')
};
