var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Hoek = require('hoek');

var Follower = require('../');
var Basic = require('hapi-auth-basic');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/auth', function () {

  it('errors on failied registrering of hapi-auth-basic', function (done) {

    var orig = Basic.register;

    Basic.register = function (plugin, options, next) {

      Basic.register = orig;
      return next(new Error('fail'));
    };

    Basic.register.attributes = {
      name: 'fake hapi-auth-basic'
    };

    Follower.init(internals.manifest, internals.composeOptions, function (err) {

      expect(err).to.exist();

      done();
    });
  });

  it('errors on missing hapi-auth-basic plugin', function (done) {

    var manifest = Hoek.clone(internals.manifest);
    delete manifest.plugins['hapi-auth-basic'];

    var failingInit = Follower.init.bind(Follower, manifest, internals.composeOptions, function (err) {

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
    'hapi-auth-basic': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
