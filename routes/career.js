const express = require('express');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const { getCareerNavigator } = require('../services/careerService');

const router = express.Router();

router.get('/career', requireStudentAuth, async (request, response, next) => {
  try {
    const navigator = await getCareerNavigator(request.student, request.query.career);
    if (request.query.career && !navigator.tracks.some((track) => track.selected)) {
      return response.status(404).render('errors/404', {
        title: 'Career not found',
        user: request.student,
        csrfToken: response.locals.csrfToken,
        currentYear: new Date().getFullYear(),
      });
    }

    return response.render('career/recommendations', {
      title: 'Career Navigator',
      user: request.student,
      ...navigator,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
