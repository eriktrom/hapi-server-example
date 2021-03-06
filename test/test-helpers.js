var Promise = require('bluebird');
var Code = require('code');

exports.generateCrumb = function generateCrumb (server, opts) {

  if (!opts) { throw Error('Forgot to pass opts or true as second param to generate crumb'); }
  if (!server) { throw Error('Forgot to pass server to generae crumb'); }

  if (opts !== true) {
    // if (!opts.method) { console.warn('the request method was not provided. Falling back to POST by default'); }
    // if (!opts.url) { console.warn('the request url was not provided. Falling back to /login by default'); }
    if (!opts.username) { console.warn('the request username was not provided. Falling back to foo by default'); }
    if (!opts.password) { console.warn('the request password was not provided. Falling back to foo by default'); }
  }

  return new Promise(function (resolve) {

    server.select('web-tls').inject({ method: 'GET', url: '/login' }, function (res) {

      var crumb = res.headers['set-cookie'][0].split('; ')[0].replace('crumb=', '');

      return resolve({
        url: opts.url || '/login',
        method: opts.method || 'POST',
        payload: {
          username: opts.username || 'foo',
          password: opts.password || 'foo',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb='+crumb
        }
      });

    });
  })
  .catch(function (err) {

    console.log('error caught from generate crumb %o', err, err.message, err.stack);
  });
};

exports.getCookie = function getCookie (res) {

  var setCookieHeader = res.headers['set-cookie'];
  Code.expect(setCookieHeader.length).to.equal(1);
  Code.expect(setCookieHeader[0]).to.contain('Max-Age=60');

  var cookieValue = setCookieHeader[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/)[1];
  return 'hapi-server='+cookieValue;
};
