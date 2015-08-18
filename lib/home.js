var Path = require('path');
var Handlebars = require('handlebars');


var internals = {
  rootPath: Path.resolve(__dirname, '../'),
  viewsPath: Path.resolve(__dirname, '../views')
};


exports.register = function (server, options, next) {

  server.dependency('AuthCookie', function (innerServer, innerNext) {

    // TODO - put global view config into static plugin

    innerServer.views({
      engines: {
        html: Handlebars
      },
      path: '../views',
      partialsPath: '../views/partials',
      relativeTo: __dirname
    });

    // Routing for static files
    innerServer.route({
      method: 'GET',
      path: '/{assetpath*}',
      handler: {
        directory: {
          path: './assets/'
        }
      }
    });

    innerServer.route([
      // Index Route

      // Login Route

      {
        method: 'GET',
        path: '/login',
        config: {
          description: 'Returns a login form',
          handler: {
            view: {
              template: 'login'
            }
          }
        }
      },

      // Home Route
      {
        method: 'GET',
        path: '/home',
        config: {
          description: 'Returns the homepage',
          handler: {
            view: {
              template: 'home'
            }
          }
        }
      }

    ]);
  });

  return next();
};


exports.register.attributes = {
  name: 'Home'
};
