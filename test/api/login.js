var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Config = require('../../lib/config');
var Follower = require('../../');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/login', function () {

  it('Ensure login works', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'POST',
        url: '/login',
        payload: internals.loginCredentials('foo', 'foo')
      };

      var tlsServer = server.select('web-tls');

      tlsServer.inject(request, function (res) {

        expect(res.statusCode, 'Status code for POST /login').to.equal(200);
        expect(res.result.username, 'Result: res.result.username').to.equal('Foo Foo');

        // Get Cookie
        var header = res.headers['set-cookie'];
        expect(header.length).to.equal(1);
        expect(header[0]).to.contain('Max-Age=60');


        // TODO: I think this is supposed to assert that going back to home does
        // not log us out

        tlsServer.inject({ method: 'GET', url: '/home', headers: res.headers }, function (res) {

          expect(res.statusCode, 'Status code for GET /home').to.equal(200);
          // expect(res.result, 'Result: res.result').to.equal('Foo Foo');

          server.stop(done);
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
  relativeTo: Path.resolve(__dirname, '../../lib')
};

internals.loginCredentials = function (username, password) {

  return JSON.stringify({"username": username, "password": password});
};
