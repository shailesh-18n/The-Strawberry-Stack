const crypto = require('node:crypto');

function csrfProtection(request, response, next) {
  if (!request.session) {
    return next(new Error('Session middleware must run before CSRF protection.'));
  }

  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    if (!request.path.startsWith('/health/') && request.path !== '/learning/offline-pack') {
      if (!request.session.csrfToken) {
        request.session.csrfToken = crypto.randomBytes(32).toString('hex');
      }
      response.locals.csrfToken = request.session.csrfToken;
    }
    return next();
  }

  response.locals.csrfToken = request.session.csrfToken || '';
  const submittedToken = request.body?._csrf || request.get('x-csrf-token');
  const expected = Buffer.from(request.session.csrfToken || '');
  const actual = typeof submittedToken === 'string' ? Buffer.from(submittedToken) : Buffer.alloc(0);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    const error = new Error('Your session token is invalid or expired. Refresh the page and try again.');
    error.status = 403;
    return next(error);
  }

  return next();
}

module.exports = csrfProtection;
