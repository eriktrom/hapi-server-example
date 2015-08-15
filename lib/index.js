'use strict';

var Hapi = require('hapi');
var Version = require('./version');

// var internals = {};

exports.init = function (port, next) {

  var server = new Hapi.Server();
  server.connection({port});

  server.register(Version, function (err) {

    if (err) { return next(err); }

    server.start(function (err) {

      return next(err, server);
    });
  });
};
