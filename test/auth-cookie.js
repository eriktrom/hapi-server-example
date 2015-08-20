var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var HapiAuthCookie = require('hapi-auth-cookie');
var Hoek = require('hoek');
var Follower = require('../');

var internals = {};

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('/auth-basic', function () {

  it('errors on failed registering of hapi-auth-cookie', {parallel: false}, function (done) {

    var orig = HapiAuthCookie.register;

    HapiAuthCookie.register = function (plugin, options, next) {

      HapiAuthCookie.register = orig;
      return next(new Error('fail'));
    };

    HapiAuthCookie.register.attributes = {
      name: 'fake hapi-auth-cookie'
    };

    Follower.init(internals.manifest, internals.composeOptions, function (err) {

      expect(err).to.exist();
      done();
    });
  });
});


internals.manifest = {
  connections: [
    {
      port: 0
    }
  ],
  plugins: {
    'hapi-auth-cookie': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
