var Glue = require('glue');
var Joi = require('joi');
var Boom = require('boom');

var internals = {};

exports.init = function (manifest, composeOptions, next) {

  Glue.compose(manifest, composeOptions, function (err, server) {

    if (err) { return next(err); }


    // TLS everything
    server.select('web').ext('onRequest', function (request, reply) {

      return reply.redirect('https://localhost:8001'+request.url.path).permanent();
    });


    // web-tls onPreResponse
    server.select('web-tls').ext('onPreResponse', function (request, reply) {

      if (!request.response.isBoom) { return reply.continue(); }


      // Bad Route Attempt
      if (request.response.output.statusCode === 404 && request.response.message === 'Not Found') {
        return reply.redirect('https://localhost:8001/home').permanent();
      }

      // Unauthorized Access Attempt web-tls - redirect ./home
      var schema = Joi.string().regex(/^Insufficient scope/);
      var result = Joi.validate(request.response.message, schema);
      if (result.error === null) {
        return reply.redirect('https://localhost:8001/home').permanent();
      }
    });


    // API onPreResponse
    server.select('api').ext('onPreResponse', function (request, reply) {

      if (!request.response.isBoom) { return reply.continue(); }


      // Made it here, then Joi validation failed
      if (request.response.output.statusCode === 400) {

        // 400 Malformed data entered
        return reply(Boom.badRequest('Malformed Data Entered'));
      }

      // Unauthorized Access Attempt on api - return JSON
      var schema = Joi.string().regex(/^Insufficient scope/);
      var scopeIssue = Joi.validate(request.response.message, schema);

      if (scopeIssue.error === null) {
        return reply(Boom.unauthorized('Unable to Complete Request')); // "oh, no!"
      }
    });

    server.start(function (err) {

      return next(err, server);
    });
  });
};
