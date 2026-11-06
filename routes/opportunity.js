const express = require('express');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const { matchStudentWithAllOpportunities } = require('../services/opportunityService');

const router = express.Router();

router.get('/opportunities', requireStudentAuth, async (request, response, next) => {
  try {
    const matches = await matchStudentWithAllOpportunities(request.student);
    return response.render('opportunities/index', {
      title: 'Opportunity Matching',
      user: request.student,
      matches,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

