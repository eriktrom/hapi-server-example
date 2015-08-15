var Code = require('code');
var Lab = require('lab');
var Follower = require('../');
var Users = require('../lib/users.json');
var Basic = require('hapi-auth-basic');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/private', function () {

  it('returns a greeting for the authenticated user', function (done) {

    Follower.init(0, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/private',
        headers: {
          authorization: internals.header('foo', Users.foo.password)
        }
      };

      server.inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(200);
        expect(res.result, 'result').to.equal('<div>Hello foo</div>');

        server.stop(done);
      });
    });
  });

  it('errors on wrong password', function (done) {

    Follower.init(0, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/private',
        headers: {
          authorization: internals.header('foo', '')
        }
      };

      server.inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(401);

        server.stop(done);
      });
    });
  });

  it('errors on failed auth', function (done) {

    Follower.init(0, function (err, server) {

      expect(err).to.not.exist();

      var request = {
        method: 'GET',
        url: '/private',
        headers: {
          authorization: internals.header('I do not exist', '')
        }
      };

      server.inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(401);

        server.stop(done);
      });
    });
  });

  it('errors on failed registering of auth', {parallel: false}, function (done) {

    var orig = Basic.register;

    Basic.register = function (plugin, options, next) {

      Basic.register = orig;
      return next(new Error('fail'));
    };

    Basic.register.attributes = {
      name: 'fake hapi-auth-basic'
    };

    Follower.init(0, function (err) {

      expect(err).to.exist();

      done();
    });
  });
});


internals.header = function (username, password) {

  return 'Basic '+(new Buffer(username+':'+password, 'utf8')).toString('base64');
};
