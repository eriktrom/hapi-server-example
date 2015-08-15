'use strict';

if (process.env.BABEL_ENV !== 'production') { require('babel/register') }
var Hoek = require('hoek');
var Server = require('./');

Server.init(8000, function (err, server) {

  Hoek.assert(!err, err);
  console.log(`Server started at: ${server.info.uri}`);
});
