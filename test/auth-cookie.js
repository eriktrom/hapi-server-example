var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Auth = require('hapi-auth-cookie');
var Hoek = require('hoek');

var Follower = require('../');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/auth-basic', function () {

  it('errors on failed registering of hapi-auth-cookie', {parallel: false}, function(done) {

    var orig = Auth.register;

    Auth.register = function(plugin, options, next) {

      Auth.register = orig;
      return next(new Error('fail'));
    };

    Auth.register.attributes = {
      name: 'fake hapi-auth-cookie'
    };

    Follower.init(internals.manifest, internals.composeOptions, function(err) {

      expect(err).to.exist();
      done();
    });
  });

  it('errors on missing hapi-auth-cookie plugin', function(done) {

    var manifest = Hoek.clone(internals.manifest);
    delete manifest.plugins['hapi-auth-cookie'];

    var failingInit = Follower.init.bind(Follower, manifest, internals.composeOptions, function(err) {

      done();
    });

    expect(failingInit).to.throw();

    done();
  });
});


internals.manifest = {
  connections: [
    {
      port: 0
    }
  ],
  plugins: {
    './auth': {},
    'hapi-auth-cookie': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
