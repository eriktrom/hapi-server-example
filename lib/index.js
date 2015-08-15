var Glue = require('glue');

var internals = {};

exports.init = function (manifest, composeOptions, next) {

  Glue.compose(manifest, composeOptions, function (err, server) {

    if (err) { return next(err); }

    server.start(function (err) {

      return next(err, server);
    });
  });
};
