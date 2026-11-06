const express = require('express');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const {
  CAREER_OPTIONS,
  LANGUAGES,
  buildStudentProfile,
  validateStudentProfile,
} = require('../utils/studentProfile');

const router = express.Router();

router.get('/dashboard', requireStudentAuth, (request, response) => {
  response.render('student/dashboard', {
    title: 'Student Dashboard',
    user: request.student,
  });
});

router.get('/profile', requireStudentAuth, (request, response) => {
  response.render('student/profile', {
    title: 'Learning Profile',
    user: request.student,
    error: null,
    saved: request.query.saved === '1',
    languages: LANGUAGES,
    careerOptions: CAREER_OPTIONS,
  });
});

router.post('/profile', requireStudentAuth, async (request, response, next) => {
  const profile = buildStudentProfile(request.body);
  const error = validateStudentProfile(profile);
  if (error) {
    return response.status(400).render('student/profile', {
      title: 'Learning Profile',
      user: { ...request.student.toObject(), ...profile },
      error,
      saved: false,
      languages: LANGUAGES,
      careerOptions: CAREER_OPTIONS,
    });
  }

  try {
    Object.assign(request.student, profile);
    await request.student.save();
    return response.redirect(303, '/profile?saved=1');
  } catch (saveError) {
    return next(saveError);
  }
});

module.exports = router;
