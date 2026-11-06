const express = require('express');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const Credential = require('../models/Credential');
const StudentAssessment = require('../models/StudentAssessment');
const { verifyCredentialAsync, issueMongoCredential } = require('../services/credentialService');

const router = express.Router();

async function syncPassedAssessmentsToCredentials(student) {
  const passedAssessments = await StudentAssessment.find({
    student: student._id,
    passed: true,
  }).populate('skill', 'name slug').lean();

  for (const assessment of passedAssessments) {
    if (assessment.skill) {
      await issueMongoCredential({
        student,
        skill: assessment.skill,
        assessment,
        assessmentResult: 'passed',
      }).catch(() => null);
    }
  }
}

router.get('/credentials', requireStudentAuth, async (request, response, next) => {
  try {
    await syncPassedAssessmentsToCredentials(request.student).catch(() => null);

    const credentials = await Credential.find({ student: request.student._id })
      .sort({ createdAt: -1 })
      .populate('skill', 'name slug')
      .lean();

    return response.render('credential/view', {
      title: 'Skill Passport',
      user: request.student,
      credentials,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/passport', requireStudentAuth, (request, response) => {
  return response.redirect(301, '/credentials');
});

router.get('/verify/preview', async (request, response, next) => {
  try {
    const verificationId = typeof request.query?.verificationId === 'string'
      ? request.query.verificationId.trim()
      : '';
    const verification = verificationId
      ? await verifyCredentialAsync(verificationId)
      : { valid: false, reason: 'No credential ID provided.' };

    return response.render('credential/verify', {
      title: 'Credential Verification',
      user: response.locals.user || null,
      verification,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/verify/:id', async (request, response, next) => {
  try {
    const verification = await verifyCredentialAsync(request.params.id);
    return response.render('credential/verify', {
      title: 'Credential Verification',
      user: response.locals.user || null,
      verification,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
