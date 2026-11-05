const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    },
  },
});

const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

function securityMiddleware(request, response, next) {
  helmetMiddleware(request, response, (helmetError) => {
    if (helmetError) return next(helmetError);
    return requestLimiter(request, response, next);
  });
}

module.exports = securityMiddleware;
