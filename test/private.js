var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Hoek = require('hoek');
var Follower = require('../');
var Users = require('../lib/users.json');
var Auth = require('../lib/auth');
var Config = require('../lib/config');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/private', function () {

  it('ensures that /private is always redirected to https', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = { method: 'GET', url: '/private' };
      server.select('web').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(301);
        expect(res.headers.location).to.equal('https://localhost:8001/private');

        server.stop(done);
      });
    });
  });

  it('returns a greeting for the authenticated user', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/private',
        headers: {
          authorization: internals.header('foo', Users.foo.password)
        }
      };

      server.select('web-tls').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(200);
        expect(res.result, 'result').to.equal('<div>Hello foo</div>');

        server.stop(done);
      });
    });
  });

  it('errors on wrong password', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/private',
        headers: {
          authorization: internals.header('foo', '')
        }
      };

      server.select('web-tls').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(401);

        server.stop(done);
      });
    });
  });

  it('errors on failed auth', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/private',
        headers: {
          authorization: internals.header('I do not exist', '')
        }
      };

      server.select('web-tls').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(401);

        server.stop(done);
      });
    });
  });

  it('errors on failed registering of auth', {parallel: false}, function (done) {

    var orig = Auth.register;

    Auth.register = function (plugin, options, next) {

      Auth.register = orig;
      return next(new Error('fail'));
    };

    Auth.register.attributes = {
      name: 'fake hapi-auth-basic'
    };

    Follower.init(internals.manifest, internals.composeOptions, function (err) {

      expect(err).to.exist();

      done();
    });
  });

  it('errors on missing Auth plugin', function (done) {

    var manifest = Hoek.clone(internals.manifest);
    delete manifest.plugins['./auth'];

    var failingInit = Follower.init.bind(Follower, manifest, internals.composeOptions, function (err) {

      done();
    });

    expect(failingInit).to.throw();

    done();
  });
});


internals.header = function (username, password) {

  return 'Basic '+(new Buffer(username+':'+password, 'utf8')).toString('base64');
};


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
    './private': {},
    './auth': {},
    'hapi-auth-basic': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
