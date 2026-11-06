const express = require('express');
const crypto = require('node:crypto');
const rateLimit = require('express-rate-limit');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const Skill = require('../models/Skill');
const StudentAssessment = require('../models/StudentAssessment');
const SkillTrackProgress = require('../models/SkillTrackProgress');
const { seedAssessmentConfigs, seedSkillData } = require('../services/seedService');
const { evaluateSkillAssessment } = require('../services/assessmentService');
const { getCodingChallenge } = require('../services/codingAssessmentService');
const { MAX_SOURCE_BYTES, OnlineCompilerError, runTests } = require('../services/onlineCompilerService');

const router = express.Router();
const assessmentSkills = new Map(seedSkillData().map((skill) => [skill.slug, skill.name]));
const codeSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  keyGenerator: (request) => String(request.student._id),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (request, response) => renderCodeResult(response, request, {
    id: 'python-sum',
  }, {
    name: 'Python basics',
  }, {
    success: false,
    message: 'You have reached the submission limit. Wait a minute before trying again.',
    passedTests: 0,
    totalTests: 4,
    score: 0,
    tests: [],
    retryable: true,
  }, 429, request.body?.submissionKey),
});

function renderCodeResult(response, request, challenge, skill, result, status = 200, submissionKey = '') {
  return response.status(status).render('assessment/result', {
    title: 'Coding assessment result',
    user: request.student,
    challengeId: challenge.id,
    skillName: skill.name,
    result,
    submissionKey,
    submittedCode: typeof request.body?.code === 'string' ? request.body.code : '',
  });
}

function limitCodeSubmissions(request, response, next) {
  if (request.body?.providerConsent !== 'yes') return next();
  return codeSubmissionLimiter(request, response, next);
}

function resultFromAssessment(attempt) {
  return {
    success: attempt.passed,
    message: attempt.passed
      ? 'All test cases passed.'
      : `${attempt.passedTests} of ${attempt.totalTests} test cases passed.`,
    passedTests: attempt.passedTests,
    totalTests: attempt.totalTests,
    score: attempt.score,
    verdict: attempt.verdict,
    tests: attempt.testResults,
    compileError: attempt.compileError,
  };
}

async function saveCodeAssessment(request, skill, challenge, code, execution) {
  const assessmentData = {
    student: request.student._id,
    challengeId: challenge.id,
    skill: skill._id,
    submissionType: 'code',
    submissionKey: request.body.submissionKey,
    passed: execution.success,
    passedTests: execution.passedTests,
    totalTests: execution.totalTests,
    score: execution.score,
    verdict: execution.verdict,
    providerSubmissionId: execution.submissionId,
    sourceHash: crypto.createHash('sha256').update(code, 'utf8').digest('hex'),
    compileError: execution.compileError,
    testResults: execution.tests,
  };
  let attempt = await StudentAssessment.findOne({
    student: request.student._id,
    submissionKey: request.body.submissionKey,
  });
  if (!attempt) {
    try {
      attempt = await StudentAssessment.create(assessmentData);
    } catch (error) {
      if (error.code !== 11000) throw error;
      attempt = await StudentAssessment.findOne({
        student: request.student._id,
        submissionKey: request.body.submissionKey,
      });
      if (!attempt) throw error;
    }
  }

  return attempt;
}

async function recordSkillTrackProgress(request, skill, attempt) {
  try {
    await SkillTrackProgress.findOneAndUpdate(
    { student: request.student._id, assessment: attempt._id },
    {
      $setOnInsert: {
        student: request.student._id,
        skill: skill._id,
        assessment: attempt._id,
        score: attempt.score,
        passed: attempt.passed,
        summary: `${attempt.passedTests} of ${attempt.totalTests} test cases passed.`,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    const savedProgress = await SkillTrackProgress.findOne({
      student: request.student._id,
      assessment: attempt._id,
    });
    if (!savedProgress) throw error;
  }
  if (attempt.passed) {
    await request.student.updateOne({ $addToSet: { assessedSkills: skill._id } });
  }
}

router.get('/assessment', requireStudentAuth, async (request, response, next) => {
  const challenges = seedAssessmentConfigs().map((assessment) => ({
    ...assessment,
    skill: assessmentSkills.get(assessment.skillSlug),
  }));
  try {
    const attempts = await StudentAssessment.find({ student: request.student._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('skill')
      .lean();
    return response.render('assessment/index', {
      title: 'Skill assessments',
      user: response.locals.user,
      challenges,
      codingChallenge: {
        ...getCodingChallenge('python-sum'),
        skill: assessmentSkills.get(getCodingChallenge('python-sum').skillSlug),
      },
      codingSubmissionKey: crypto.randomUUID(),
      attempts,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/assessment/:challengeId/submit', requireStudentAuth, async (request, response, next) => {
  const challenge = seedAssessmentConfigs().find((item) => item.id === request.params.challengeId);
  if (!challenge) {
    return response.status(404).render('errors/404', {
      title: 'Assessment not found',
      user: request.student,
      csrfToken: response.locals.csrfToken,
      currentYear: new Date().getFullYear(),
    });
  }
  if (!request.body || typeof request.body !== 'object') {
    return response.status(400).render('assessment/result', {
      title: 'Skill assessment',
      user: request.student,
      challengeId: challenge.id,
      skillName: assessmentSkills.get(challenge.skillSlug),
      result: { success: false, message: 'Submit your answers to the challenge.', passedTests: 0, totalTests: challenge.questions.length },
    });
  }

  try {
    const skill = await Skill.findOne({ slug: challenge.skillSlug });
    if (!skill) {
      throw new Error(`Assessment skill "${challenge.skillSlug}" is missing from the skill catalogue.`);
    }
    const result = evaluateSkillAssessment(challenge.id, request.body);
    await StudentAssessment.create({
      student: request.student._id,
      challengeId: challenge.id,
      skill: skill._id,
      passed: result.success,
      passedTests: result.passedTests || 0,
      totalTests: challenge.questions.length,
    });
    if (result.success) {
      const alreadyAssessed = request.student.assessedSkills
        .some((assessedSkill) => String(assessedSkill) === String(skill._id));
      if (!alreadyAssessed) request.student.assessedSkills.push(skill._id);
      await request.student.save();
    }

    return response.render('assessment/result', {
      title: 'Skill assessment result',
      user: request.student,
      challengeId: challenge.id,
      skillName: skill.name,
      result,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/assessment/:challengeId/submit-code', requireStudentAuth, limitCodeSubmissions, async (request, response, next) => {
  const challenge = getCodingChallenge(request.params.challengeId);
  if (!challenge) {
    return response.status(404).render('errors/404', {
      title: 'Assessment not found',
      user: request.student,
      csrfToken: response.locals.csrfToken,
      currentYear: new Date().getFullYear(),
    });
  }

  let skill;
  let submissionKey;
  try {
    skill = await Skill.findOne({ slug: challenge.skillSlug });
    if (!skill) {
      throw new Error(`Assessment skill "${challenge.skillSlug}" is missing from the skill catalogue.`);
    }
    const code = request.body?.code;
    submissionKey = request.body?.submissionKey;
    if (request.body?.providerConsent !== 'yes') {
      return renderCodeResult(response, request, challenge, skill, {
        success: false,
        message: 'Confirm the code-processing notice before submitting.',
        passedTests: 0,
        totalTests: challenge.tests.length,
        score: 0,
        tests: [],
      }, 400, submissionKey);
    }
    if (typeof submissionKey !== 'string' || !/^[\x21-\x7e]{1,100}$/.test(submissionKey)) {
      return renderCodeResult(response, request, challenge, skill, {
        success: false,
        message: 'Refresh the assessment page and try again.',
        passedTests: 0,
        totalTests: challenge.tests.length,
        score: 0,
        tests: [],
      }, 400, '');
    }
    if (typeof code !== 'string' || Buffer.byteLength(code, 'utf8') > MAX_SOURCE_BYTES || code.includes('\0')) {
      return renderCodeResult(response, request, challenge, skill, {
        success: false,
        message: 'Enter valid Python code no larger than 8 KB.',
        passedTests: 0,
        totalTests: challenge.tests.length,
        score: 0,
        tests: [],
        retryable: true,
      }, 400, submissionKey);
    }

    const existing = await StudentAssessment.findOne({
      student: request.student._id,
      submissionType: 'code',
      submissionKey,
    });
    const attempt = existing || await saveCodeAssessment(
      request,
      skill,
      challenge,
      code,
      await runTests({ code, challenge, submissionKey }),
    );
    await recordSkillTrackProgress(request, skill, attempt);
    return renderCodeResult(response, request, challenge, skill, resultFromAssessment(attempt));
  } catch (error) {
    if (error instanceof OnlineCompilerError) {
      return renderCodeResult(response, request, challenge, skill, {
        success: false,
        message: error.message,
        passedTests: 0,
        totalTests: challenge.tests.length,
        score: 0,
        tests: [],
        retryable: error.kind !== 'not_configured' && error.kind !== 'invalid_response',
      }, error.statusCode, submissionKey);
    }
    return next(error);
  }
});

module.exports = router;
