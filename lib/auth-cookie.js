var internals = {};

exports.register = function (server, options, next) {

  /**
  Code inside the callback of a server.dependency will only be executed after
  hapi-auth-cookie has been registered. It's triggered by server.start and runs
  before actual starting of the server.

  It's done because the call to server.auth.strategy upon registration would
  fail and make the server crash if the cookie scheme is not  previously
  registered by hapi-auth-cookie

  NOTE - I can't tell if this comment was really talking about cookie or basic
  auth. The comment said basic but it looked like a copy paste from the other
  auth file which i assume we'll be deleting.
   */

  server.dependency('hapi-auth-cookie', function (innerServer, innerNext) {

    innerServer.auth.strategy('follower', 'cookie', {
      password: 'secret',
      ttl: 60*1000,
      cookie: 'followers-api',
      clearInvalid: true,
      redirectTo: '/login',
      isSecure: true
    });

    // Blacklist all routes
    innerServer.auth.default({
      strategy: 'follower'
    });

    return innerNext();
  });

  return next();
};


exports.register.attributes = {
  name: 'AuthCookie'
};
