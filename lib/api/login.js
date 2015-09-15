var Hoek = require('hoek');
var Fixture = require('../fixture.json');
var Boom = require('boom');
var Joi = require('joi');
var Promise = require('bluebird'); // jshint ignore:line
var Config = require('../config');
var _ = require('lodash');

var internals = {};

internals.findUser = function (givenUsername) {
  // will access the db and therefore be async, so we make it a cheap promise
  return Promise.resolve().then(function () {

    return _.findWhere(Fixture.users, { username: givenUsername });
  });
};

internals.authenticateUser = function (foundUser, givenPassword) {

  if (!foundUser)                           { throw Error(Config.genericLoginErrorMsg); }
  if (foundUser.password !== givenPassword) { throw Error(Config.genericLoginErrorMsg); }

  // The user is now known and matches. Rename them to a session user
  // by cloning the object and deleting the password property before returning
  var sessionUser = Hoek.clone(foundUser);
  delete sessionUser.password;

  return sessionUser;
};

internals.after = function (server, next) {

  server.route({
    method: 'POST',
    path: '/login',
    config: {
      description: 'Returns the login page',
      auth: {
        mode: 'try',
        strategy: 'cookiez'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        },
        crumb: {
          key: 'crumb',
          source: 'payload', // this tests payload crumb value.
          restful: true      // do not need to make Joi validation for crumb.
        }
      },
      validate: {
        payload: {
          username: Joi.string().min(3).max(6).required(),
          password: Joi.string().min(3).max(7).required()
        }
      },
      handler: function (request, reply) {

        var givenUsername = request.payload.username;
        var givenPassword = request.payload.password;

        return internals.findUser(givenUsername).then(function (foundUser) {

            return internals.authenticateUser(foundUser, givenPassword);
          }).then(function (sessionUser) {

            request.auth.session.set(sessionUser); // Success, begin session and set cookie
            return reply(sessionUser);
          })
          .catch(function (err) {

            return reply(Boom.unauthorized(err.message));
          });
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/logout',
    config: {
      auth: {
        strategy: 'cookiez',
        scope: ['user', 'admin']
      },
      plugins: {
        crumb: {
          key: 'crumb',
          source: 'payload', // this tests payload crumb value.
          restful: true      // do not need to make Joi validation for crumb.
        }
      },
      handler: function (request, reply) {

        request.auth.session.clear();

        return reply({ message: 'Logged out' });
      }
    }
  });

  return next();
};

exports.register = function (server, options, next) {

  server.dependency(['AuthCookie', 'crumb'], internals.after);
  return next();
};

exports.register.attributes = {
  name: 'Login'
};
