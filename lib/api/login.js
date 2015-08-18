var Hoek = require('hoek');
var Users = require('../users.json');
var Boom = require('boom');

var internals = {};

internals.getValidateUser = function (username, password) {

  return new Promise(function (resolve, reject) {

    var account = null;

    if (!username || !password) {
      throw { errorNum: 1, message: 'Did not submit password or username' };
    } else {

      account = Users[username];

      if (!account || account.password !== password) {
        throw { errorNum: 2, message: 'Invalid password or username' };
      }

      // Remove sensitive data from user cookie info

      var accountCopy = Hoek.clone(account);
      delete accountCopy.password;

      resolve(accountCopy);
    }
  });
};

exports.register = function (server, options, next) {

  /**
  Code inside the callback function of server.dependency will only be executed
  after AuthCookie plugin has been registered.

  It's triggered by server.start, and runs before actual starting of the server.

  It's done because the call to server.route upon registration with
  auth:'cookie' config would fail and make the server crash if the basic
  strategy is not previously registered by Auth.
   */

  server.dependency('AuthCookie', function (innerServer, innerNext) {

    innerServer.route({
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
        handler: function (request, reply) {

          internals.getValidateUser(request.payload.username, request.payload.password)
            .then(function (account) {

              request.auth.session.set(account); // Success { id: 1, email: 'foo@hapiu.com' }

              return reply(account);
            })
            .catch(function (err) {

              return reply(Boom.unauthorized(err.message)); // "oh, no!"
            });
        }
      }
    });

    innerServer.route({
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

    return innerNext();
  });

  return next();
};

exports.register.attributes = {
  name: 'Login'
};
