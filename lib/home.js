var Path = require('path');
var Handlebars = require('handlebars');


var internals = {
  rootPath: Path.resolve(__dirname, '../'),
  viewsPath: Path.resolve(__dirname, '../views')
};


exports.register = function (server, options, next) {

  server.views({
    engines: {
      html: Handlebars
    },
    path: '../views',
    relativeTo: __dirname
  });

  server.route({
    method: 'GET',
    path: '/home',
    config: {
      description: 'Returns the homepage',
      handler: {
        view: {
          template: 'home',
          context: {
            path: Path.relative(internals.rootPath, Path.resolve(internals.viewsPath, 'home.html'))
          }
        }
      }
    }
  });

  return next();
};


exports.register.attributes = {
  name: 'Home'
};
