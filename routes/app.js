const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getCareerRecommendations } = require('../services/careerService');
const { buildAssistantReply } = require('../services/aiService');
const { evaluatePythonChallenge } = require('../services/assessmentService');
const { createCredentialRecord, verifyCredential, createQrCodeDataUrl } = require('../services/credentialService');
const { listCareers, getUserById, createAssessmentRecord, createProgressRecord, listProgressRecords, listCredentials, getCredentialById, createCredential } = require('../utils/store');
const { seedDemoUser } = require('../utils/store');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { title: 'VidyaChain', user: req.session.user || null, message: null });
});

router.get('/dashboard', requireAuth, async (req, res) => {
  const user = getUserById(req.session.user.id);
  const recommendation = getCareerRecommendations(user);
  const history = listProgressRecords(user.id);
  res.render('student/dashboard', {
    title: 'Student Dashboard',
    user,
    recommendation,
    history,
  });
});

router.get('/profile', requireAuth, (req, res) => {
  const user = getUserById(req.session.user.id);
  res.render('student/profile', { title: 'Profile', user });
});

router.get('/career', requireAuth, (req, res) => {
  const user = getUserById(req.session.user.id);
  const careers = listCareers();
  const recommendation = getCareerRecommendations(user);
  res.render('career/recommendations', {
    title: 'Career Navigator',
    user,
    careers,
    recommendation,
  });
});

router.post('/career/recommend', requireAuth, (req, res) => {
  const user = getUserById(req.session.user.id);
  const recommendation = getCareerRecommendations(user);
  res.render('career/recommendations', {
    title: 'Career Navigator',
    user,
    careers: listCareers(),
    recommendation,
  });
});

router.get('/assistant', requireAuth, (req, res) => {
  const user = getUserById(req.session.user.id);
  const question = req.query.q || 'What should I learn next?';
  const response = buildAssistantReply(user, question, user.preferredLanguage || 'Bengali');
  res.render('learning/assistant', {
    title: 'Vernacular AI Assistant',
    user,
    question,
    response,
  });
});

router.post('/assistant', requireAuth, (req, res) => {
  const user = getUserById(req.session.user.id);
  const question = req.body.question || 'What should I learn next?';
  const response = buildAssistantReply(user, question, user.preferredLanguage || 'Bengali');
  res.render('learning/assistant', {
    title: 'Vernacular AI Assistant',
    user,
    question,
    response,
  });
});

router.get('/assessment', requireAuth, (req, res) => {
  const user = getUserById(req.session.user.id);
  const challenges = [
    {
      id: 'python-basics',
      title: 'Python Basics Challenge',
      skill: 'Python basics',
      description: 'Return the sum of all numbers in a list.',
    },
    {
      id: 'string-logic',
      title: 'String Logic Challenge',
      skill: 'Problem solving',
      description: 'Count the vowels in a word.',
    },
  ];

  res.render('assessment/index', { title: 'Assessments', user, challenges });
});

router.post('/assessment/:challengeId/submit', requireAuth, async (req, res) => {
  const user = getUserById(req.session.user.id);
  const challengeId = req.params.challengeId;
  const submission = req.body.code || '';
  const result = evaluatePythonChallenge(challengeId, submission);
  const successText = result.success ? 'Passed' : 'Needs revision';

  const record = createAssessmentRecord({
    userId: user.id,
    challengeId,
    title: challengeId,
    score: result.passedTests || 0,
    result: successText,
    rawOutput: result.output || '',
    passed: !!result.success,
  });

  const skillName = challengeId === 'python-basics' ? 'Python basics' : 'Problem solving';
  const today = new Date();

  const progress = createProgressRecord({
    userId: user.id,
    challengeId,
    skillName,
    commitMessage: `${successText}: ${skillName}`,
    previousLevel: 'beginner',
    currentLevel: result.success ? 'intermediate' : 'beginner',
    changeSummary: result.success ? 'Improved by solving the challenge.' : 'Needs another round of practice.',
    timestamp: today.toISOString(),
  });

  if (result.success) {
    const currentUser = getUserById(user.id);
    const nextSkills = Array.from(new Set([...(currentUser.skillInventory || []), skillName]));
    currentUser.skillInventory = nextSkills;
    currentUser.profileSummary = `${currentUser.profileSummary} Skill tracked on ${today.toISOString()}.`;
  }

  const credentialRecord = createCredentialRecord({
    userId: user.id,
    studentName: user.name,
    skillName,
    assessmentId: record.id,
    assessmentResult: result.success ? 'passed' : 'needs-review',
  });

  const credential = createCredential(credentialRecord);

  const qrDataUrl = await createQrCodeDataUrl(credential.id).catch(() => null);

  res.render('assessment/result', {
    title: 'Assessment Result',
    user,
    result,
    progress,
    credential,
    qrDataUrl,
    challengeId,
  });
});

router.get('/skilltrack', requireAuth, (req, res) => {
  const user = getUserById(req.session.user.id);
  const records = listProgressRecords(user.id);
  res.render('skilltrack/log', { title: 'SkillTrack', user, records });
});

router.get('/credentials', requireAuth, async (req, res) => {
  const user = getUserById(req.session.user.id);
  const credentials = listCredentials(user.id);
  res.render('credential/view', { title: 'Skill Passport', user, credentials, verifyCredential });
});

router.get('/verify/preview', (req, res) => {
  const verificationId = req.query.verificationId || '';
  const verification = verificationId ? verifyCredential(verificationId) : { valid: false, reason: 'No credential ID provided.' };
  res.render('recruiter/verify', {
    title: 'Credential Verification',
    verification,
  });
});

router.get('/verify/:id', async (req, res) => {
  const verification = verifyCredential(req.params.id);
  res.render('recruiter/verify', {
    title: 'Credential Verification',
    verification,
  });
});

router.get('/recruiter', (req, res) => {
  res.render('recruiter/dashboard', { title: 'Recruiter Dashboard', user: req.session.user || null });
});

router.get('/seed-demo', (req, res) => {
  const demo = seedDemoUser();
  req.session.user = {
    id: demo.id,
    name: demo.name,
    email: demo.email,
    preferredLanguage: demo.preferredLanguage,
    interests: demo.interests,
    skillInventory: demo.skillInventory,
    aspirations: demo.aspirations,
  };
  res.redirect('/dashboard');
});

module.exports = router;
