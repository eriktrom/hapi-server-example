var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Cheerio = require('cheerio');
var Config = require('../../lib/config');
var Server = require('../..');
var TestHelpers = require('../test-helpers');

var internals = {};

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('/login SUCCESS', function () {

  it('access login page', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      var request1 = {
        method: 'GET',
        url: '/login'
      };

      server.select('web-tls').inject(request1, function (res) {

        expect(res.statusCode, 'Status code').to.equal(200);

        server.stop(done);
      });
    });
  });

  it('successful login', function (done) {
    //  *****  HELPS  *****
    //  Helpful links to build out crumb tests
    //  https://github.com/npm/newww/blob/2bc02c7558c7a3b8bdb34858ff99cd77d7c7c06a/test/handlers/crumb.js
    //  https://github.com/npm/newww/blob/2bc02c7558c7a3b8bdb34858ff99cd77d7c7c06a/test/handlers/user/login.js
    //  https://github.com/npm/newww/blob/master/routes/public.js

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      // Successfull Login

      TestHelpers.generateCrumb(server, true).then(function (request) {

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username).to.equal('foo');

          // ./home greets authenticated user

          var request2 = {
            method: 'GET',
            url: '/home',
            headers: {
              cookie: TestHelpers.getCookie(res)
            }
          };

          server.select('web-tls').inject(request2, function (res2) {

            var $ = Cheerio.load(res2.result);
            var result = ($('h1', 'body').text());

            expect(result).to.equal('Foo Foo');


            // ./login GET redirects to account if already logged in.


            var request3 = {
              method: 'GET',
              url: '/login',
              headers: {
                cookie: TestHelpers.getCookie(res) // still use res 1 for cookie
              }
            };

            server.select('web-tls').inject(request3, function (res3) {

              expect(res3.statusCode, 'GET /login redirects to account if already logged in.').to.equal(302);
              expect(res3.headers.location).to.include('/account');

              server.stop(done);
            });
          });
        });
      });
    });
  });

  it('Cookie auth login succeeds - with good password & username', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, true).then(function (request) {

        server.select('web-tls').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);

          server.stop(done);
        });
      });
    });
  });

  it('Cookie auth login succeeds - does not return password in success response', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, true).then(function (request) {

        server.select('web-tls').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username, 'username is included in response').to.equal('foo');
          expect(res.result.password, 'password is NOT included in response').to.equal(undefined);

          server.stop(done);
        });
      });
    });
  });

  it('test crumb and not much else', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      TestHelpers.generateCrumb(server, true).then(function (request) {

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

});


describe('/login FAILURE - Cookie auth login fails', function () {

  it('b/c NO crumb', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      var request = {
        method: 'POST',
        url: '/login',
        payload: { username: 'foo', password: 'foo' }
      };

      server.select('web-tls').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(401);
        expect(res.result.message).to.equal(Config.genericLoginErrorMsg);

        server.stop(done);
      });
    });
  });

  it('with bad password', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      TestHelpers.generateCrumb(server, {username: 'foo', password: 'blah'}).then(function (request) {

        server.select('web-tls').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(401);
          expect(res.result.message).to.equal(Config.genericLoginErrorMsg);

          server.stop(done);
        });
      });
    });
  });

  it('with bad username', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      TestHelpers.generateCrumb(server, {username: 'fudge', password: 'foo'}).then(function (request) {

        server.select('web-tls').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(401);
          expect(res.result.message).to.equal(Config.genericLoginErrorMsg);

          server.stop(done);
        });
      });
    });
  });

  it('with too short username', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, {username: 'f', password: 'foo'}).then(function (request) {

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(401);
          expect(res.result.message).to.equal(Config.genericLoginErrorMsg);

          server.stop(done);
        });
      });
    });
  });

  it('with missing username', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, true).then(function (request) {

        delete request.payload.username;

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(401);
          expect(res.result.message).to.equal(Config.genericLoginErrorMsg);

          server.stop(done);
        });
      });
    });
  });

  it('with missing password', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, true).then(function (request) {

        delete request.payload.password;

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(401);
          expect(res.result.message).to.equal(Config.genericLoginErrorMsg);

          server.stop(done);
        });
      });
    });
  });

  it('with missing username & password', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, true).then(function (request) {

        delete request.payload.username;
        delete request.payload.password;

        server.select('api').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(401);
          expect(res.result.message).to.equal(Config.genericLoginErrorMsg);

          server.stop(done);
        });
      });
    });
  });
});

describe('/logout', function () {

  it('Ensure logout works', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, true).then(function (request) {

        server.select('web-tls').inject(request, function (res) {

          expect(res.statusCode, 'Status code').to.equal(200);
          expect(res.result.username).to.equal('foo');


          var cookie1 = request.headers.cookie;
          var cookie2 = TestHelpers.getCookie(res);
          var newCookie = cookie1 + '; ' + cookie2;

          var request2 = {
            method: 'POST',
            url: '/logout',
            payload: {
              request: 'logout',
              crumb: request.payload.crumb
            },
            headers: {
              cookie: newCookie
            }
          };

          server.select('api').inject(request2, function (res2) {

            expect(res2.result.message).to.equal('Logged out');
            expect(res2.statusCode, 'Status code').to.equal(200);

            server.stop(done);
          });
        });
      });
    });
  });

  it('Redirects to /login page when followers-api cookie is not set upon logout', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      TestHelpers.generateCrumb(server, true).then(function (request) {

        server.select('web-tls').inject(request, function (/*res*/) {

          var cookie1 = request.headers.cookie;
          var newCookie = cookie1; // variant apart from last test

          var request2 = {
            method: 'POST',
            url: '/logout',
            payload: {
              request: 'logout',
              crumb: request.payload.crumb
            },
            headers: {
              cookie: newCookie
            }
          };

          server.select('api').inject(request2, function (res2) {

            expect(res2.statusCode, 'Status code').to.equal(302);
            expect(res2.headers.location).to.equal('/login');

            server.stop(done);
          });
        });
      });
    });
  });

  it('unregistered user tried to access restricted ./logout on api', function (done) {

    Server.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'POST',
        url: '/logout'
      };

      server.select('api').inject(request, function (res) {

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
    'crumb': Config.crumb,
    'vision': {},
    'visionary': {
      'engines': { 'html': 'handlebars' },
      'path': '../../views',
      relativeTo: __dirname
    },
    'inert': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../../lib')
};
