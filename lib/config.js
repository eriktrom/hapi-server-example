var Fs = require('fs');

var config = module.exports = {};

// Configuring TLS
config.tls = {
  key: Fs.readFileSync('./lib/certs/key.key'),
  cert: Fs.readFileSync('./lib/certs/cert.crt'),

  // only necessary if using the client certificate authentication
  requestCert: true,

  // Only necessary if client is using a self signed certificate
  ca: []
};
