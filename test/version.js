var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Follower = require('../');
var Package = require('../package.json');
var Config = require('../lib/config');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/version', function () {

  it('ensures that /version is always redirected to https', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = { method: 'GET', url: '/version' };
      server.select('web').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(301);
        expect(res.headers.location).to.equal('https://localhost:8001/version');

        server.stop(done);
      });
    });
  });

  it('returns the version from package.json', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      server.select('web-tls').inject('/version', function (res) {

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
    './version': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
