'use strict';

var Hapi = require('hapi');
var Version = require('../lib/version');
var Server = require('../lib');
var Code = require('code');
var Lab = require('lab');

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('Server', function () {

  it('starts server and returns hapi server object', function (done) {

    Server.init(0, function (err, server) {

      expect(err).to.not.exist();
      expect(server).to.be.instanceof(Hapi.Server);

      server.stop(done);
    });
  });

  it('starts server on provided port', function (done) {

    Server.init(5000, function (err, server) {

      expect(err).to.not.exist();
      expect(server.info.port).to.equal(5000);

      server.stop(done);
    });
  });

  it('handles register plugin errors', {parallel: false}, function (done) {

    var register = Version.register;
    Version.register = function (server, options, next) {

      return next(new Error('register version failed'));
    };

    Version.register.attributes = {
      name: 'fake version'
    };

    Server.init(0, function (err/*, server*/) {

      expect(err).to.exist();
      expect(err.message).to.equal('register version failed');

      Version.register = register;

      // server.stop(done);
      done();
    });
  });
});
