// Load modules

var Glue = require('glue');
var Joi = require('joi');
var Boom = require('boom');
var Hoek = require('hoek');

// Declare internals

var internals = {};


exports.init = function(manifest, composeOptions, next) {

  Glue.compose(manifest, composeOptions, function(err, server) {

    if (err) { return next(err); }

    // TLS everything

    server.select('web').ext('onRequest', function(request, reply) {

      return reply.redirect('https://localhost:8001' + request.url.path).permanent();
    });


    // web-tls onPreResponse


    server.select('web-tls').ext('onPreResponse', function(request, reply) {

      //  if (!request.response.isBoom) return reply.continue(); will break! Only boom errors have request.response.output
      if (request.response.isBoom) {

        // Bad Route Attempt
        if (request.response.output.statusCode === 404 &&
          request.response.message === 'Not Found') {

          return reply.redirect('https://localhost:8001/home').permanent();
        }


        // Catch hapi-auth-cookie insufficient scope responses. Don't really need
        // joi for this at all but whatever.
        var schema = Joi.string().regex(/^Insufficient scope/);
        var result = Joi.validate(request.response.message, schema);

        if (result.error === null) {
          return reply.redirect('https://localhost:8001/home').permanent();
        }
      }

      return reply.continue();
    });


    // API onPreResponse


    server.select('api').ext('onPreResponse', function(request, reply) {

      // Note request.response.output is added to response by boom
      if (request.response.isBoom) {
        // Joi Validation Failed.

        // 400 Malformed data entered.
        if (request.response.output.statusCode === 400) {
          return reply(Boom.badRequest('Malformed Data Entered'));
        }

        // Crumb Validation Failed forbidden
        if (request.response.output.statusCode === 403) {
          return reply(Boom.forbidden('What Are You Doing!!!'));
        }

      }

      return reply.continue();
    });

    /*
    TODO: learn how to register vision, a 'view manager' plugin, via Glue
     */
    server.register(require('vision'), function (err) { Hoek.assert(!err, err); });
    server.views({
      engines: {
        html: require('handlebars')
      },
      path: '../views',
      partialsPath: '../views/partials',
      relativeTo: __dirname
    });

    /*
    TODO: register this with glue as well, did not try
     */
    server.register(require('inert'), function (err) { Hoek.assert(!err, err); });
    server.register(require('lout'), function (err) { Hoek.assert(!err, err); });

    // Start the server

    server.start(function(err) {

      return next(err, server);
    });
  });
};
