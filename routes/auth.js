const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  CAREER_OPTIONS,
  LANGUAGES,
  buildStudentProfile,
  isValidEmail,
  normalizeEmail,
  validateStudentProfile,
} = require('../utils/studentProfile');

const router = express.Router();

function regenerateSession(request) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(request) {
  return new Promise((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });
}

function renderRegistration(response, { error = null, formData = {} } = {}, status = 200) {
  return response.status(status).render('auth/register', {
    title: 'Create your student profile',
    error,
    formData,
    languages: LANGUAGES,
    careerOptions: CAREER_OPTIONS,
  });
}

router.get('/register', (_request, response) => renderRegistration(response));

router.post('/register', async (request, response, next) => {
  const email = normalizeEmail(request.body.email);
  const formData = { ...buildStudentProfile(request.body), email };
  const password = typeof request.body.password === 'string' ? request.body.password : '';

  if (!isValidEmail(email)) {
    return renderRegistration(response, { error: 'Enter a valid email address.', formData }, 400);
  }
  if (password.length < 10 || Buffer.byteLength(password, 'utf8') > 72) {
    return renderRegistration(response, { error: 'Choose a password with at least 10 characters and no more than 72 UTF-8 bytes.', formData }, 400);
  }
  const profileError = validateStudentProfile(formData);
  if (profileError) {
    return renderRegistration(response, { error: profileError, formData }, 400);
  }

  try {
    const existing = await User.exists({ email });
    if (existing) {
      return renderRegistration(response, { error: 'An account with that email already exists.', formData }, 409);
    }

    const user = await User.create({
      ...formData,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });

    await regenerateSession(request);
    request.session.userId = user.id;
    await saveSession(request);
    return response.redirect(303, '/dashboard');
  } catch (error) {
    if (error.code === 11000) {
      return renderRegistration(response, { error: 'An account with that email already exists.', formData }, 409);
    }
    return next(error);
  }
});

router.get('/login', (_request, response) => {
  response.render('auth/login', {
    title: 'Login',
    error: null,
    email: '',
  });
});

router.post('/login', async (request, response, next) => {
  const email = normalizeEmail(request.body.email);
  const password = typeof request.body.password === 'string' ? request.body.password : '';

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    const valid = user
      && Buffer.byteLength(password, 'utf8') <= 72
      && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return response.status(401).render('auth/login', {
        title: 'Login',
        error: 'Email or password is incorrect.',
        email,
      });
    }

    const returnTo = request.session.returnTo;
    await regenerateSession(request);
    request.session.userId = user.id;
    if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      request.session.returnTo = returnTo;
    }
    await saveSession(request);
    const redirectTo = request.session.returnTo || '/dashboard';
    delete request.session.returnTo;
    return response.redirect(303, redirectTo);
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (request, response, next) => {
  request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie('vidyachain.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return response.redirect(303, '/');
  });
});

module.exports = router;
