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

    // TODO - put global view config into static plugin
    innerServer.views({
      engines: {
        html: require('handlebars')
      },
      path: '../views',
      partialsPath: '../views/partials',
      relativeTo: __dirname
    });

    // Routing for static files
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
            username = { first: 'Erik', last: 'Trom' };
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
            redirectTo: false // '/login' if set redirects to ./login.
          }
        },
        handler: function (request, reply) {

          // Already logged in
          if (request.auth.isAuthenticated) {
            return reply.redirect('/account').code(301);
          }

          return reply.view('login');
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
