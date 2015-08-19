var Fs = require('fs');

var config = module.exports = {};

// Configuring TLS
config.tls = {
  key: Fs.readFileSync('./lib/certs/server.key'),
  cert: Fs.readFileSync('./lib/certs/server.crt'),

  // only necessary if using the client certificate authentication
  requestCert: true,

  // Only necessary if client is using a self signed certificate
  ca: []
};

config.crumb = {
  cookieOptions: {
    isSecure: true
  },
  autoGenerate: true
};

config.monitor = {
  opsInterval: 1000,
  reporters: [{
    reporter: require('good-console'),
    events: {
      log: '*',
      response: '*'
    }
  }, {
    reporter: require('good-file'),
    events: {
      // ops: '*'
      log: '*',
      response: '*'
    },
    config: './logs/development.log'
  }]
};

// @Example of logging to a remote server.
// config.monitor = {
//   opsInterval: 1000,
//   reporters: [
//     {
//       reporter: require('good-console'),
//       events: {
//         log: '*',
//         response: '*'
//       }
//     },
//     {
//       reporter: require('good-file'),
//       events: {
//         ops: '*'
//       },
//       config: './test/fixtures/monitor_log'
//     },
//     {
//       reporter: 'good-http',
//       events: {
//         ops: '*',
//         log: '*',
//         response: '*'
//       },
//       config: {
//         endpoint: 'http://localhost:3000',
//         wreck: {
//           headers: {
//             'x-api-key': 12345
//           }
//         }
//       }
//     }
//   ]
// };
