var Glue = require('glue');

var internals = {};

exports.init = function (manifest, composeOptions, next) {

  Glue.compose(manifest, composeOptions, function (err, server) {

    if (err) { return next(err); }

    // TLS everything
    server.select('web').ext('onRequest', function (request, reply) {

      return reply.redirect('https://localhost:8001'+request.url.path).permanent();
    });

    server.start(function (err) {

      return next(err, server);
    });
  });
};
