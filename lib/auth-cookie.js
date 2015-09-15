var internals = {};

internals.after = function (server, next) {

  server.auth.strategy('cookiez', 'cookie', {
    password: 'secret',
    ttl: 60*1000,
    cookie: 'hapi-server',
    clearInvalid: true,
    redirectTo: '/login',
    isSecure: true
  });

  // Blacklist all routes
  server.auth.default({
    strategy: 'cookiez'
  });

  return next();
};

exports.register = function (server, options, next) {

  server.dependency('hapi-auth-cookie', internals.after);
  return next();
};


exports.register.attributes = {
  name: 'AuthCookie'
};
