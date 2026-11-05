const express = require('express');
const bcrypt = require('bcryptjs');
const { getUserByEmail, createUser } = require('../utils/store');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);

  if (!user) {
    return res.render('auth/login', { title: 'Login', error: 'No account matches that email.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return res.render('auth/login', { title: 'Login', error: 'Incorrect password.' });
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    interests: user.interests,
    skillInventory: user.skillInventory,
    aspirations: user.aspirations,
  };

  const redirectTo = req.session.returnTo || '/dashboard';
  delete req.session.returnTo;
  res.redirect(redirectTo);
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register', error: null });
});

router.post('/register', async (req, res) => {
  const { name, email, password, preferredLanguage, interests, aspirations, skillInventory, educationLevel, learningPreferences, accessNeeds, profileSummary } = req.body;

  if (!name || !email || !password) {
    return res.render('auth/register', { title: 'Register', error: 'Name, email, and password are required.' });
  }

  const existing = getUserByEmail(email);
  if (existing) {
    return res.render('auth/register', { title: 'Register', error: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({
    name,
    email,
    passwordHash,
    preferredLanguage,
    interests: (interests || '').split(',').map((item) => item.trim()).filter(Boolean),
    aspirations: (aspirations || '').split(',').map((item) => item.trim()).filter(Boolean),
    skillInventory: (skillInventory || '').split(',').map((item) => item.trim()).filter(Boolean),
    educationLevel,
    learningPreferences: (learningPreferences || '').split(',').map((item) => item.trim()).filter(Boolean),
    accessNeeds: (accessNeeds || '').split(',').map((item) => item.trim()).filter(Boolean),
    profileSummary,
  });

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
    interests: user.interests,
    skillInventory: user.skillInventory,
    aspirations: user.aspirations,
  };

  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
