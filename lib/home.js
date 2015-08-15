var Path = require('path');
var Handlebars = require('handlebars');


var internals = {
  rootPath: Path.resolve(__dirname, '../'),
  viewsPath: Path.resolve(__dirname, '../views')
};


exports.register = function (server, options, next) {

  // TODO - put global view config into static plugin

  server.views({
    engines: {
      html: Handlebars
    },
    path: '../views',
    partialsPath: '../views/partials',
    relativeTo: __dirname
  });

  // Routing for static files
  server.route({
    method: 'GET',
    path: '/{assetpath*}',
    handler: {
      directory: {
        path: './assets/'
      }
    }
  });

  server.route([
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

  return next();
};


exports.register.attributes = {
  name: 'Home'
};
