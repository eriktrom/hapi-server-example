var internals = {};

internals.after = function (server, next) {

  // Static Assets
  server.route({
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
  server.route({
    method: 'GET',
    path: '/',
    config: {
      description: 'Redirects to the homepage',
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

        return reply.redirect('/home').permanent();
      }
    }
  });

  server.route({
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
        var user = null;

        if (request.auth.isAuthenticated) {

          // User logged in, show user links
          user = {
            first: request.auth.credentials.first,
            last: request.auth.credentials.last
          };
        }

        return reply.view('home', { user: user });
      }
    }
  });

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

        if (request.auth.isAuthenticated) {
          return reply.redirect('/account');
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

        var admin = false;
        if (request.auth.credentials.scope[0] === 'admin') { admin = true; }

        var user = {
          first: request.auth.credentials.first,
          last: request.auth.credentials.last
        };

        return reply.view('account', { user: user, admin: admin });
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

  return next();
};

exports.register = function (server, options, next) {

  server.dependency(['AuthCookie', 'crumb'], internals.after);
  return next();
};

exports.register.attributes = {
  name: 'Home'
};
