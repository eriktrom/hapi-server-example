var Path = require('path');

var internals = {};

exports.register = function (server, options, next) {

  /**
  Code inside the callback function of server.dependency will only be executed
  after AuthCookie plugin has been registered.

  It's triggered by server.start, and runs before before actual starting of the
  server.

  This is done b/c the call to server.route upon registration with auth:
  'cookie' config would fail and make the server crash if the basic strategy is
  not previously registered by Auth

   */

  server.dependency('AuthCookie', function (innerServer, innerNext) {

    innerServer.views({
      engines: {
        html: require('handlebars')
      },
      path: '../views',
      partialsPath: '../views/partials',
      relativeTo: __dirname
    });


    // Static Assets

    innerServer.route({
      method: 'GET',
      path: '/{assetpath*}',
      config: {
        description: 'Static Assets Route',
        auth: false, // Turn off auth restrictions for static assets
        handler: {
          directory: {
            path: './assets/'
          }
        }
      }
    });

    // Routes

    innerServer.route({
      method: 'GET',
      path: '/home',
      config: {
        description: 'Returns the homepage',
        auth: {
          mode: 'try',
          strategy: 'follower'
        },
        plugins: {
          'hapi-auth-cookie': {
            redirectTo: false // '/login' if set redirects to ./login
          }
        },
        handler: function (request, reply) {

          // Already logged in
          var username = null;

          if (request.auth.isAuthenticated) {

            // User logged in, show user links
            username = {
              first: request.auth.credentials.first,
              last: request.auth.credentials.first // should be last?
            };
          }

          return reply.view('home', { user: username });
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/login',
      config: {
        description: 'Returns the login page',
        auth: {
          mode: 'try',
          strategy: 'follower'
        },
        plugins: {
          'hapi-auth-cookie': {
            redirectTo: false // if set redirects to set route
          }
        },
        handler: function (request, reply) {

          // Already logged in
          // but this causes funky stuff
          // If logout then go to /login route route is blank no error nothing
          if (request.auth.isAuthenticated) {
            return reply.redirect('/account').code(301);
          }

          return reply.view('login');
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/account',
      config: {
        auth: {
          strategy: 'follower',
          scope: ['admin', 'user']
        },
        handler: function (request, reply) {

          // Admin check
          var administrator = null;

          if (request.auth.credentials.scope[0] === 'admin') {
            // User is admin
            administrator = {
              first: request.auth.credentials.first,
              last: request.auth.credentials.first // should be last?
            }
          }

          return reply.view('account', { admin: administrator });
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/admin',
      config: {
        auth: {
          strategy: 'follower',
          scope: ['admin']
        },
        handler: function (request, reply) {

          return reply.view('admin');
        }
      }
    });

    return innerNext();
  });

  return next();
};


exports.register.attributes = {
  name: 'Home'
};
