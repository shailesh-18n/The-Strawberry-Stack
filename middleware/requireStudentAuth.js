const User = require('../models/User');

async function requireStudentAuth(request, response, next) {
  if (!request.session?.userId) {
    request.session.returnTo = request.originalUrl;
    return response.redirect('/auth/login');
  }

  try {
    const user = await User.findById(request.session.userId);
    if (!user) {
      request.session.destroy(() => {});
      return response.redirect('/auth/login');
    }
    request.student = user;
    response.locals.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = requireStudentAuth;
