'use strict';

var Server = require('../lib');
var Code = require('code');
var Lab = require('lab');
var Package = require('../package.json');


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('/version', function () {

  it('returns the version from package.json', function (done) {

    Server.init(0, function (err, server) {

      expect(err).to.not.exist();

      server.inject('/version', function (res) {

        expect(res.statusCode).to.equal(200);
        expect(res.result).to.deep.equal({version: Package.version});

        server.stop(done);
      });
    });
  });
});
