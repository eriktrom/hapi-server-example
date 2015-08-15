var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Follower = require('../');
var Package = require('../package.json');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/version', function () {

  it('returns the version from package.json', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      server.inject('/version', function (res) {

        expect(res.statusCode).to.equal(200);
        expect(res.result).to.deep.equal({version: Package.version});

        server.stop(done);
      });
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
    './version': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
