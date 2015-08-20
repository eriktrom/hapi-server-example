var internals = {};

internals.after = function (server, next) {

  server.auth.strategy('follower', 'cookie', {
    password: 'secret',
    ttl: 60*1000,
    cookie: 'followers-api',
    clearInvalid: true,
    redirectTo: '/login',
    isSecure: true
  });

  // Blacklist all routes
  server.auth.default({
    strategy: 'follower'
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
