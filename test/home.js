var Code = require('code');
var Lab = require('lab');
var Path = require('path');
var Follower = require('../');
var Config = require('../lib/config');


var internals = {};


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('/home', function () {

  it('returns the home page containing relative path from root to home template', function (done) {

    Follower.init(internals.manifest, internals.composeOptions, function (err, server) {

      expect(err).to.not.exist();

      var request = { method: 'GET', url: '/home' };

      server.select('web-tls').inject(request, function (res) {

        expect(res.statusCode, 'Status code').to.equal(200);

        // output should be: views/home.html
        var expectedHTMLOutput =
          Path.relative(
            Path.resolve('__dirname', '../'),
            Path.resolve('__dirname', '../views/home.html')
          );

        // trim actual output to remove trailing newline (\n)
        var actualHTMLOutput = res.result.trim();

        expect(actualHTMLOutput, 'html output').to.equal(expectedHTMLOutput);

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
      labels: ['web-tls'],
      tls: Config.tls
    }
  ],
  plugins: {
    './home': {}
  }
};

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '../lib')
};
