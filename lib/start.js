var Hoek = require('hoek');
var Server = require('./');
var Composer = require('./manifest');

Server.init(Composer.manifest, Composer.composeOptions, function (err, server) {

  Hoek.assert(!err, err);

  // Server connections
  var web = server.select('web');
  var webTls = server.select('web-tls');

  // Logging started server
  console.log('Web server started at:', web.info.uri);
  console.log('WebTLS server started at:', webTls.info.uri);
});
