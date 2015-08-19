var Hoek = require('hoek');
var Users = require('../users.json');
var Boom = require('boom');
var Joi = require('joi');
var Promise = require('bluebird'); // jshint ignore:line

var internals = {};

internals.validateUser = function (username, password) {
  // will access the db and therefore be async, so we make it a cheap promise

  return Promise.resolve().then(function () {
    if (!username || !password) { throw Error('Did not submit password or username'); }

    var user = Users[username];
    if (!user || user.password !== password) { throw Error('Invalid password or username'); }

    // Remove sensitive data from user cookie info
    var userCopy = Hoek.clone(user);
    delete userCopy.password;

    return userCopy;
  });
};

internals.after = function (server, next) {

  server.route({
    method: 'POST',
    path: '/login',
    config: {
      description: 'Returns the login page',
      auth: {
        mode: 'try',
        strategy: 'follower'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      validate: {
        payload: { // payload for POST, query for GET
          username: Joi.string().min(3).max(6),
          password: Joi.string().min(3).max(7)
        }
      },
      handler: function (request, reply) {

        var username = request.payload.username,
            password = request.payload.password;

        return internals.validateUser(username, password).then(function (account) {
            request.auth.session.set(account); // Success, begin session and set cookie
            return reply(account);
          }).catch(function (err) {
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
        strategy: 'follower',
        scope: ['user', 'admin']
      },
      handler: function (request, reply) {

        request.auth.session.clear();

        return reply({ message: 'Logged out' });
      }
    }
  });

  return next();
}

exports.register = function (server, options, next) {
  server.dependency('AuthCookie', internals.after);
  return next();
};

exports.register.attributes = {
  name: 'Login'
};
