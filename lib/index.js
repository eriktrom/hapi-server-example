// Load modules

var Glue = require('glue');
var Joi = require('joi');
var Boom = require('boom');
// var Handlebars = require('handlebars');
var Config = require('./config');

// Declare internals

var internals = {};

// internals.onPreStart = function (server, next) {

//   server.views({
//     engines: {
//       html: Handlebars
//     },
//     path: '../views',
//     relativeTo: __dirname
//   });

//   return next();
// };

internals.onWebRequest = function (request, reply) {

  return reply.redirect('https://localhost:8001' + request.url.path).permanent();
};

internals.onApiPreResponse = function (request, reply) {

  function pp (obj) {

    return JSON.stringify(obj, null, 4);
  }

  // Note request.response.output is added to response by boom
  if (request.response.isBoom) {

    // catch payload validation errors and spit out a generic message
    //
    // this is for login/auth only ATM - in the future we'll want the
    // useful validation errors from joi, but never for username/password
    // combo fields
    if (request.response.output.statusCode === 400) {
      console.log('Joi login payload validation error', pp(request.response.output));
      return reply(Boom.unauthorized(Config.genericLoginErrorMsg));
    }

    // Crumb Validation Failed
    //
    // catch forbidden error thrown by crumb and turn it into a normal un-authorized
    // error so we don't give any hints out about how to break in
    if (request.response.output.statusCode === 403) {
      console.log('Joi login payload validation error', pp(request.response.output));
      return reply(Boom.unauthorized(Config.genericLoginErrorMsg));
    }

  }

  return reply.continue();
};

internals.onSecureWebPreResponse = function (request, reply) {

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
};

exports.init = function (manifest, composeOptions, next) {

  Glue.compose(manifest, composeOptions, function (err, server) {

    if (err) { return next(err); }
    server.select('web').ext('onRequest', internals.onWebRequest);
    server.select('web-tls').ext('onPreResponse', internals.onSecureWebPreResponse);
    server.select('api').ext('onPreResponse', internals.onApiPreResponse);
    // server.ext('onPreStart', internals.onPreStart);

    server.start(function (err) {

      return next(err, server);
    });
  });
};
