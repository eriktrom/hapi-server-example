// Load modules

var Glue = require('glue');
var Joi = require('joi');
var Boom = require('boom');
var Hoek = require('hoek');
var Config = require('./config');

// Declare internals

var internals = {};

internals.pp = function (obj) {

  return JSON.stringify(obj, null, 4);
};

internals.assertNotError = function (err) {

  Hoek.assert(!err, err);
};


exports.init = function (manifest, composeOptions, next) {

  Glue.compose(manifest, composeOptions, function (err, server) {

    if (err) { return next(err); }

    // TLS everything

    server.select('web').ext('onRequest', function (request, reply) {

      return reply.redirect('https://localhost:8001' + request.url.path).permanent();
    });


    // web-tls onPreResponse
    server.select('web-tls').ext('onPreResponse', function (request, reply) {

      //  if (!request.response.isBoom) return reply.continue(); will break! Only boom errors have request.response.output
      if (request.response.isBoom) {

        // Bad Route Attempt
        if (request.response.output.statusCode === 404 && request.response.message === 'Not Found') {

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


    server.select('api').ext('onPreResponse', function (request, reply) {

      // Note request.response.output is added to response by boom
      if (request.response.isBoom) {

        // 400 Malformed data entered. Wrong username/password
        //
        // We catch this to prevent
        //  `child "username" fails because ["username" length must be at least 3 characters long]`
        // joi validation error from being sent to client
        //
        // TODO: write test for this
        if (request.response.output.statusCode === 400) {
          console.log('Joi login payload validation error', internals.pp(request.response.output));
          return reply(Boom.unauthorized(Config.genericLoginErrorMsg));
        }

        // Crumb Validation Failed forbidden
        if (request.response.output.statusCode === 403) {
          console.log('Joi login payload validation error', internals.pp(request.response.output));
          return reply(Boom.unauthorized(Config.genericLoginErrorMsg));
        }

      }

      return reply.continue();
    });

    /*
    TODO: learn how to register vision, a 'view manager' plugin, via Glue
     */
    server.register(require('vision'), internals.assertNotError);

    server.views({
      engines: {
        html: require('handlebars')
      },
      path: '../views',
      relativeTo: __dirname
    });

    /*
    TODO: register this with glue as well, did not try
     */
    server.register(require('inert'), internals.assertNotError);
    server.register(require('lout'), internals.assertNotError);

    // Start the server

    server.start(function (err) {

      return next(err, server);
    });
  });
};
