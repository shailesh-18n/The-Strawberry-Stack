const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
require('dotenv').config({ quiet: true });
process.env.SESSION_SECRET ||= 'test-only-session-secret-not-for-deployment';
const mongoose = require('mongoose');
const { connectDatabase, isMongoAvailable } = require('../config/db');
const { parseDnsServers } = require('../config/dns');
const User = require('../models/User');
const Career = require('../models/Career');
const Skill = require('../models/Skill');
const StudentAssessment = require('../models/StudentAssessment');
const LearningProgress = require('../models/LearningProgress');
const SkillTrackProgress = require('../models/SkillTrackProgress');
const SkillTrackEntry = require('../models/SkillTrackEntry');
const Credential = require('../models/Credential');
const Opportunity = require('../models/Opportunity');
const { seedCatalog } = require('../services/catalogService');
const { getCareerNavigator } = require('../services/careerService');
const { evaluateSkillAssessment } = require('../services/assessmentService');
const { verifyCredential, createCredentialRecord } = require('../services/credentialService');
const { createCredential } = require('../utils/store');
const app = require('../app');

test('production proxy configuration trusts only the Render ingress hop', () => {
  const setting = execFileSync(process.execPath, ['-e', [
    "process.env.SESSION_SECRET = 'test-only-session-secret-not-for-deployment';",
    "process.env.TRUST_PROXY = 'true';",
    "process.stdout.write(String(require('./app').get('trust proxy')));",
  ].join(' ')], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, MONGODB_URI: '' },
  });

  assert.equal(setting, '1');
});

let server;
let baseUrl;
const mongoConfigured = Boolean(process.env.MONGODB_URI);

before(async () => {
  if (mongoConfigured) {
    await connectDatabase();
    await seedCatalog();
  }
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  if (app.locals.sessionStore) {
    await app.locals.sessionStore.close();
  }
  await mongoose.disconnect();
});

test('guided Python assessment evaluates submitted choices', () => {
  const result = evaluateSkillAssessment('python-basics', {
    answer_0: 'sum',
    answer_1: 'zero',
  });
  assert.equal(result.success, true);
  assert.equal(result.totalTests, 2);
});

test('credential signing produces a valid record', () => {
  const credential = createCredentialRecord({
    userId: 'demo-user',
    studentName: 'Vivek Das',
    skillName: 'Python basics',
    assessmentId: 'demo-assessment',
    assessmentResult: 'passed',
  });

  const saved = createCredential(credential);
  const verification = verifyCredential(saved.id);

  assert.equal(verification.valid, true);
  assert.equal(verification.credential.skillName, 'Python basics');
});

test('home page renders the student onboarding landing page', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /Connect your interests to your learning goals/);
  assert.match(html, /student account/i);
  assert.match(html, /<main class="container py-5">/);
  assert.match(html, /bootstrap@5\.3\.3/);
});

test('unknown routes render a shared-layout 404 page', async () => {
  const response = await fetch(`${baseUrl}/not-a-route`);
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.match(html, /<main class="container py-5">/);
  assert.match(html, /Page not found/);
});

test('liveness does not depend on MongoDB', async () => {
  const response = await fetch(`${baseUrl}/health/live`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  assert.equal(response.headers.get('set-cookie'), null);
});

test('readiness reflects the MongoDB connection state', async () => {
  const response = await fetch(`${baseUrl}/health/ready`);

  if (isMongoAvailable()) {
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ready', database: 'connected' });
  } else {
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'not_ready', database: 'disconnected' });
  }
});

test('security headers are applied', async () => {
  const response = await fetch(baseUrl);

  assert.equal(response.headers.get('x-powered-by'), null);
  assert.match(response.headers.get('content-security-policy'), /cdn\.jsdelivr\.net/);
  assert.ok(response.headers.get('x-content-type-options'));
});

test('DNS servers are optional and validated as IP addresses', () => {
  assert.deepEqual(parseDnsServers(''), []);
  assert.deepEqual(parseDnsServers('1.1.1.1, 8.8.8.8'), ['1.1.1.1', '8.8.8.8']);
  assert.deepEqual(parseDnsServers('2001:4860:4860::8888'), ['2001:4860:4860::8888']);
  assert.throws(() => parseDnsServers('resolver.example.com'), /IP addresses/);
});

test('static public assets are served', async () => {
  const response = await fetch(`${baseUrl}/public/css/style.css`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
});

test('offline learning pack and lesson shell are public and cacheable', async () => {
  const packResponse = await fetch(`${baseUrl}/learning/offline-pack`);
  const pack = await packResponse.json();
  const pageResponse = await fetch(`${baseUrl}/public/offline-learning.html`);
  const pageHtml = await pageResponse.text();
  const manifestResponse = await fetch(`${baseUrl}/public/manifest.json`);
  const manifest = await manifestResponse.json();
  const workerResponse = await fetch(`${baseUrl}/sw.js`);
  const iconResponse = await fetch(`${baseUrl}/public/icons/icon-192.png`);

  assert.equal(packResponse.status, 200);
  assert.match(packResponse.headers.get('cache-control'), /public/);
  assert.equal(packResponse.headers.get('set-cookie'), null);
  assert.deepEqual(pack.lessons.map((lesson) => lesson.skillSlug), ['html', 'css', 'javascript']);
  assert.equal(pageResponse.status, 200);
  assert.match(pageHtml, /Keep learning, even without a connection/);
  assert.match(pageHtml, /\/public\/js\/app\.js/);
  assert.equal(manifestResponse.status, 200);
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
  assert.equal(workerResponse.status, 200);
  assert.equal(workerResponse.headers.get('service-worker-allowed'), '/');
  assert.match(await workerResponse.text(), /vidyachain-offline-learning-v4/);
  assert.equal(iconResponse.status, 200);
  assert.match(iconResponse.headers.get('content-type'), /image\/png/);
});

test('malformed JSON receives a client error response', async () => {
  const response = await fetch(`${baseUrl}/health/live`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });

  assert.equal(response.status, 400);
  assert.match(await response.text(), /Invalid request/);
});

test('oversized request bodies are rejected', async () => {
  const response = await fetch(`${baseUrl}/health/live`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload: 'x'.repeat(11 * 1024) }),
  });

  assert.equal(response.status, 413);
  assert.match(await response.text(), /Request too large/);
});

test('student registration, profile updates, login, and persistence use MongoDB', {
  skip: !mongoConfigured,
}, async () => {
  const email = `phase2-${crypto.randomUUID()}@example.test`;
  const privateStudentId = new mongoose.Types.ObjectId();
  let cookie = '';
  const updateCookie = (response) => {
    const setCookie = response.headers.getSetCookie()
      .find((value) => value.startsWith('vidyachain.sid='));
    if (setCookie) cookie = setCookie.split(';')[0];
  };
  const csrfFrom = (html) => {
    const match = html.match(/name="_csrf" value="([^"]+)"/);
    assert.ok(match, 'CSRF token is present in the form');
    return match[1];
  };
  const get = async (path) => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: cookie ? { cookie } : {},
      redirect: 'manual',
    });
    updateCookie(response);
    return response;
  };
  const post = async (path, fields) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(cookie ? { cookie } : {}),
      },
      body: new URLSearchParams(fields),
      redirect: 'manual',
    });
    updateCookie(response);
    return response;
  };
  const postJson = async (path, fields, csrfToken) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(fields),
      redirect: 'manual',
    });
    updateCookie(response);
    return response;
  };

  try {
    const pythonSkill = await Skill.findOne({ slug: 'python-basics' }).populate('prerequisites');
    assert.ok(pythonSkill, 'structured Python skill is persisted');
    assert.ok(pythonSkill.prerequisites.some((skill) => skill.slug === 'logical-thinking'));
    const webCareer = await Career.findOne({ slug: 'web-developer' }).populate('requiredSkills.skill');
    assert.ok(webCareer.requiredSkills.some((mapping) => mapping.skill.slug === 'html'));

    const pythonProfile = await getCareerNavigator({
      aspirations: ['Python Developer'],
      interests: ['automation'],
      skillInventory: ['Python basics'],
      assessedSkills: [],
    });
    const dataProfile = await getCareerNavigator({
      aspirations: ['Data Analyst'],
      interests: ['analytics'],
      skillInventory: ['Statistics', 'Excel', 'SQL', 'Visualization', 'Communication'],
      assessedSkills: [],
    });
    assert.equal(pythonProfile.recommendation.career.slug, 'python-developer');
    assert.equal(dataProfile.recommendation.career.slug, 'data-analyst');
    assert.equal(dataProfile.recommendation.completionPercent, 100);

    const registrationPage = await get('/auth/register');
    assert.equal(registrationPage.status, 200);
    const registrationHtml = await registrationPage.text();
    assert.match(registrationHtml, /Bengali/);
    assert.match(registrationHtml, /Hindi/);
    assert.match(registrationHtml, /Kannada/);
    assert.match(registrationHtml, /Python Developer/);
    assert.match(registrationHtml, /name="skillInventory"/);

    const registration = await post('/auth/register', {
      _csrf: csrfFrom(registrationHtml),
      name: 'Phase Two Student',
      email,
      password: 'a-long-phase-two-password',
      preferredLanguage: 'Bengali',
      interests: 'Python, Accessibility',
      aspirations: 'Python Developer',
      educationLevel: 'Higher Secondary',
      skillInventory: 'HTML',
      learningPreferences: 'Project-based learning',
      accessNeeds: 'Low bandwidth',
      profileSummary: 'Learning step by step.',
    });
    assert.equal(registration.status, 303);
    assert.equal(registration.headers.get('location'), '/dashboard');

    const dashboard = await get('/dashboard');
    assert.equal(dashboard.status, 200);
    assert.match(await dashboard.text(), /Welcome, Phase Two Student/);

    const duplicateRegistrationPage = await get('/auth/register');
    const duplicateRegistration = await post('/auth/register', {
      _csrf: csrfFrom(await duplicateRegistrationPage.text()),
      name: 'Another Student',
      email,
      password: 'a-different-long-password',
      preferredLanguage: 'English',
    });
    assert.equal(duplicateRegistration.status, 409);

    let user = await User.findOne({ email }).select('+passwordHash');
    assert.ok(user, 'new student is stored in MongoDB');
    assert.notEqual(user.passwordHash, 'a-long-phase-two-password');
    assert.match(user.passwordHash, /^\$2[aby]\$/);
    assert.equal(user.preferredLanguage, 'Bengali');
    assert.deepEqual(user.interests, ['Python', 'Accessibility']);
    assert.deepEqual(user.aspirations, ['Python Developer']);
    assert.deepEqual(user.skillInventory, ['HTML']);

    const profilePage = await get('/profile');
    assert.equal(profilePage.status, 200);
    const profileHtml = await profilePage.text();
    assert.match(profileHtml, /value="Bengali" selected/);
    assert.match(profileHtml, /value="Python Developer" checked/);
    assert.match(profileHtml, /name="skillInventory"/);
    assert.doesNotMatch(profileHtml, /passwordHash/);

    const invalidProfileUpdate = await post('/profile', {
      _csrf: csrfFrom(profileHtml),
      name: 'X',
      preferredLanguage: 'English',
    });
    assert.equal(invalidProfileUpdate.status, 400);
    assert.match(await invalidProfileUpdate.text(), /Enter a name between 2 and 80 characters/);
    user = await User.findOne({ email });
    assert.equal(user.name, 'Phase Two Student', 'invalid profile changes are not persisted');

    const profileUpdate = await post('/profile', {
      _csrf: csrfFrom(profileHtml),
      name: 'Updated Student',
      preferredLanguage: 'English',
      interests: 'Web accessibility, JavaScript',
      aspirations: 'Web Developer',
      educationLevel: 'University',
      skillInventory: 'HTML, CSS',
      learningPreferences: 'Hands-on projects',
      accessNeeds: '',
      profileSummary: 'Updated from the profile page.',
    });
    assert.equal(profileUpdate.status, 303);
    assert.equal(profileUpdate.headers.get('location'), '/profile?saved=1');

    user = await User.findOne({ email });
    assert.equal(user.name, 'Updated Student');
    assert.equal(user.preferredLanguage, 'English');
    assert.deepEqual(user.interests, ['Web accessibility', 'JavaScript']);
    assert.deepEqual(user.aspirations, ['Web Developer']);
    assert.deepEqual(user.skillInventory, ['HTML', 'CSS']);
    assert.equal(user.profileSummary, 'Updated from the profile page.');

    const careerPage = await get('/career');
    const careerHtml = await careerPage.text();
    assert.equal(careerPage.status, 200);
    assert.match(careerHtml, /Career Navigator/);
    assert.match(careerHtml, /Top profile match/);
    assert.match(careerHtml, /Web Developer/);
    assert.match(careerHtml, /HTML, CSS/);
    assert.match(careerHtml, /JavaScript, Responsive design, APIs, Testing/);
    assert.match(careerHtml, /class="skill-graph-scroll"/);
    assert.match(careerHtml, /<svg class="skill-graph"/);
    assert.match(careerHtml, /skill-graph-edge prerequisite/);
    assert.match(careerHtml, /Suggested learning roadmap/);
    assert.match(careerHtml, /col-12 col-lg-4/);
    assert.match(careerHtml, /name="viewport"/);

    const selectedCareerPage = await get('/career?career=python-developer');
    assert.equal(selectedCareerPage.status, 200);
    assert.match(await selectedCareerPage.text(), /Selected career path/);
    const unknownCareerPage = await get('/career?career=not-a-career');
    assert.equal(unknownCareerPage.status, 404);

    const skillTrackPage = await get('/skilltrack');
    const skillTrackHtml = await skillTrackPage.text();
    assert.equal(skillTrackPage.status, 200);
    assert.match(skillTrackHtml, /Learning progress/);
    assert.match(skillTrackHtml, /Coding assessment progress/);
    assert.match(skillTrackHtml, /Offline lesson progress/);
    const invalidSkillTrackEntry = await post('/skilltrack', {
      _csrf: csrfFrom(skillTrackHtml),
      skillId: String(pythonSkill._id),
      currentLevel: 'expert',
      commitMessage: 'Made progress',
      changeSummary: 'Practiced the basics.',
    });
    assert.equal(invalidSkillTrackEntry.status, 400);
    assert.equal(await SkillTrackEntry.countDocuments({ student: user._id }), 0);
    const firstSkillTrackEntry = await post('/skilltrack', {
      _csrf: csrfFrom(skillTrackHtml),
      skillId: String(pythonSkill._id),
      currentLevel: 'intermediate',
      commitMessage: 'Solved a list practice task',
      changeSummary: 'Used loops and functions to process a list of values.',
    });
    assert.equal(firstSkillTrackEntry.status, 303);
    let savedSkillTrackEntry = await SkillTrackEntry.findOne({ student: user._id, skill: pythonSkill._id }).lean();
    assert.equal(savedSkillTrackEntry.previousLevel, 'beginner');
    assert.equal(savedSkillTrackEntry.currentLevel, 'intermediate');
    const secondSkillTrackEntry = await post('/skilltrack', {
      _csrf: csrfFrom(skillTrackHtml),
      skillId: String(pythonSkill._id),
      currentLevel: 'advanced',
      commitMessage: 'Completed a more complex exercise',
      changeSummary: 'Compared several list-processing approaches and tested edge cases.',
    });
    assert.equal(secondSkillTrackEntry.status, 303);
    savedSkillTrackEntry = await SkillTrackEntry.findOne({
      student: user._id,
      skill: pythonSkill._id,
    }).sort({ createdAt: -1 }).lean();
    assert.equal(savedSkillTrackEntry.previousLevel, 'intermediate');
    assert.equal(savedSkillTrackEntry.currentLevel, 'advanced');
    const savedSkillTrackPage = await get('/skilltrack?saved=1');
    const savedSkillTrackHtml = await savedSkillTrackPage.text();
    assert.equal(savedSkillTrackPage.status, 200);
    assert.match(savedSkillTrackHtml, /Your learning milestone was saved/);
    assert.match(savedSkillTrackHtml, /Completed a more complex exercise/);

    const taggedMilestone = await post('/skilltrack', {
      _csrf: csrfFrom(savedSkillTrackHtml),
      skillId: String(pythonSkill._id),
      currentLevel: 'advanced',
      commitMessage: 'Tagged milestone achievement',
      changeSummary: 'Verified project milestone completed on python branch.',
      branch: 'python-developer',
      tag: 'v1.0-milestone',
    });
    assert.equal(taggedMilestone.status, 303);
    const taggedEntry = await SkillTrackEntry.findOne({
      student: user._id,
      tag: 'v1.0-milestone',
    }).lean();
    assert.ok(taggedEntry, 'tagged milestone record must be created');
    assert.equal(taggedEntry.branch, 'python-developer');
    assert.equal(taggedEntry.tag, 'v1.0-milestone');
    assert.match(taggedEntry.commitHash, /^[0-9a-f]{8}$/);

    // Skill regression test
    const regressedMilestone = await post('/skilltrack', {
      _csrf: csrfFrom(savedSkillTrackHtml),
      skillId: String(pythonSkill._id),
      currentLevel: 'intermediate',
      commitMessage: 'Refactoring after identifying knowledge gap',
      changeSummary: 'Revisiting intermediate concepts after encountering difficulties.',
      branch: 'python-developer',
    });
    assert.equal(regressedMilestone.status, 303);
    const regressedEntry = await SkillTrackEntry.findOne({
      student: user._id,
      commitMessage: 'Refactoring after identifying knowledge gap',
    }).lean();
    assert.ok(regressedEntry, 'regressed record must be saved');
    assert.equal(regressedEntry.previousLevel, 'advanced');
    assert.equal(regressedEntry.currentLevel, 'intermediate');
    assert.equal(regressedEntry.status, 'regressed');
    assert.match(regressedEntry.diff, /Skill regression recorded/);

    // Historical record preservation: historical achievements are NEVER silently overwritten!
    const advancedHistoryEntry = await SkillTrackEntry.findOne({
      student: user._id,
      commitMessage: 'Completed a more complex exercise',
    }).lean();
    assert.ok(advancedHistoryEntry, 'prior advanced achievement must be preserved');
    assert.equal(advancedHistoryEntry.currentLevel, 'advanced');
    assert.equal(await SkillTrackEntry.countDocuments({ student: user._id }), 4);

    // Chronological order verification
    const allEntries = await SkillTrackEntry.find({ student: user._id }).sort({ createdAt: -1 }).lean();
    assert.equal(allEntries[0].commitMessage, 'Refactoring after identifying knowledge gap');
    assert.equal(allEntries[1].commitMessage, 'Tagged milestone achievement');
    assert.equal(allEntries[2].commitMessage, 'Completed a more complex exercise');
    assert.equal(allEntries[3].commitMessage, 'Solved a list practice task');
    await SkillTrackEntry.create({
      student: privateStudentId,
      skill: pythonSkill._id,
      previousLevel: 'beginner',
      currentLevel: 'advanced',
      commitMessage: 'Another learner private milestone',
      changeSummary: 'This record must not appear in the signed-in learner history.',
    });
    const privateSkillTrackPage = await get('/skilltrack');
    assert.doesNotMatch(await privateSkillTrackPage.text(), /Another learner private milestone/);
    await SkillTrackEntry.deleteOne({ commitMessage: 'Another learner private milestone' });

    const assessmentPage = await get('/assessment');
    assert.equal(assessmentPage.status, 200);
    const assessmentHtml = await assessmentPage.text();
    assert.match(assessmentHtml, /name="_csrf"/);
    assert.match(assessmentHtml, /Python Basics Challenge/);
    assert.match(assessmentHtml, /OnlineCompiler\.io/);
    assert.match(assessmentHtml, /name="providerConsent"/);
    assert.match(assessmentHtml, /name="submissionKey"/);
    assert.match(assessmentHtml, /public\/js\/assessment\.js/);
    const executionSentinel = `phase6-code-${crypto.randomUUID().replaceAll('-', '')}`;
    const codeSubmission = await post('/assessment/python-basics/submit', {
      _csrf: csrfFrom(assessmentHtml),
      code: `process.env.${executionSentinel} = 'executed'`,
    });
    const codeSubmissionHtml = await codeSubmission.text();
    assert.equal(codeSubmission.status, 200);
    assert.match(codeSubmissionHtml, /Needs revision/);
    assert.equal(process.env[executionSentinel], undefined, 'submitted code is never evaluated in the Express process');
    const rejectedCodeAttempt = await StudentAssessment.findOne({
      student: user._id,
      challengeId: 'python-basics',
    }).sort({ createdAt: -1 });
    assert.equal(rejectedCodeAttempt.passed, false);
    assert.equal(rejectedCodeAttempt.passedTests, 0);
    assert.equal(rejectedCodeAttempt.totalTests, 2);

    const failedAssessment = await post('/assessment/python-basics/submit', {
      _csrf: csrfFrom(assessmentHtml),
      answer_0: 'count',
      answer_1: 'error',
    });
    assert.match(await failedAssessment.text(), /Needs revision/);
    user = await User.findOne({ email });
    assert.equal(user.assessedSkills.length, 0, 'failed assessments do not verify a skill');

    const codingPage = await get('/assessment');
    const codingHtml = await codingPage.text();
    const codeKey = codingHtml.match(/name="submissionKey" value="([^"]+)"/)?.[1];
    assert.ok(codeKey, 'coding form includes a server-generated idempotency key');
    const missingConsent = await post('/assessment/python-sum/submit-code', {
      _csrf: csrfFrom(codingHtml),
      submissionKey: codeKey,
      code: 'print(1)',
    });
    assert.equal(missingConsent.status, 400, 'code is not sent without explicit provider consent');
    const previousProviderKey = process.env.ONLINECOMPILER_API_KEY;
    const originalFetch = globalThis.fetch;
    let providerCalls = 0;
    let providerBody;
    process.env.ONLINECOMPILER_API_KEY = 'test-only-provider-key';
    globalThis.fetch = async (input, options) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url === 'https://api.onlinecompiler.io/api/run-tests/') {
        providerCalls += 1;
        const headers = new Headers(options.headers);
        assert.equal(headers.get('authorization'), 'test-only-provider-key');
        assert.equal(headers.get('idempotency-key'), codeKey);
        providerBody = JSON.parse(options.body);
        return new Response(JSON.stringify({
          verdict: 'wrong_answer',
          score: 75,
          passed: 3,
          total: 4,
          submission: 'sub_test',
          tests: [
            { verdict: 'accepted', hidden: false, output: '6\n', error: '' },
            { verdict: 'accepted', hidden: true, output: 'hidden output', error: '' },
            { verdict: 'wrong_answer', hidden: true, output: 'hidden output', error: 'hidden error' },
            { verdict: 'accepted', hidden: true },
          ],
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return originalFetch(input, options);
    };
    let codeResultHtml;
    try {
      const codeResult = await post('/assessment/python-sum/submit-code', {
        _csrf: csrfFrom(codingHtml),
        submissionKey: codeKey,
        providerConsent: 'yes',
        code: 'n = int(input())\nvalues = list(map(int, input().split())) if n else []\nprint(sum(values))',
      });
      assert.equal(codeResult.status, 200);
      codeResultHtml = await codeResult.text();
      assert.match(codeResultHtml, /75\.00%/);
      assert.match(codeResultHtml, /Test 4 \(hidden\)/);
      assert.doesNotMatch(codeResultHtml, /hidden output|hidden error/);
      assert.equal(providerBody.compiler, 'python-3.14');
      assert.equal(providerBody.tests.length, 4);
      assert.equal(providerBody.tests.filter((item) => item.hidden).length, 3);

      const codeAttempt = await StudentAssessment.findOne({
        student: user._id,
        challengeId: 'python-sum',
        submissionKey: codeKey,
      });
      assert.equal(codeAttempt.submissionType, 'code');
      assert.equal(codeAttempt.passed, false);
      assert.equal(codeAttempt.score, 75);
      assert.equal(codeAttempt.passedTests, 3);
      assert.equal(codeAttempt.totalTests, 4);
      assert.equal(codeAttempt.code, undefined, 'submitted source is not stored in MongoDB');
      assert.match(codeAttempt.sourceHash, /^[a-f0-9]{64}$/);
      assert.equal(codeAttempt.testResults[2].output, '');
      assert.equal(codeAttempt.testResults[2].error, '');
      const trackRecord = await SkillTrackProgress.findOne({
        student: user._id,
        assessment: codeAttempt._id,
      });
      assert.equal(trackRecord.score, 75);
      assert.equal(trackRecord.passed, false);

      const retryResult = await post('/assessment/python-sum/submit-code', {
        _csrf: csrfFrom(codingHtml),
        submissionKey: codeKey,
        providerConsent: 'yes',
        code: 'n = int(input())\nvalues = list(map(int, input().split())) if n else []\nprint(sum(values))',
      });
      assert.equal(retryResult.status, 200);
      assert.equal(providerCalls, 1, 'repeating an assessment key does not repeat provider execution');
      assert.equal(await StudentAssessment.countDocuments({ student: user._id, submissionKey: codeKey }), 1);
      assert.equal(await SkillTrackProgress.countDocuments({ student: user._id, assessment: codeAttempt._id }), 1);
      user = await User.findById(user._id);
      assert.equal(user.assessedSkills.length, 0, 'a partial coding score does not verify the skill');
    } finally {
      globalThis.fetch = originalFetch;
      if (previousProviderKey === undefined) delete process.env.ONLINECOMPILER_API_KEY;
      else process.env.ONLINECOMPILER_API_KEY = previousProviderKey;
    }

    if (process.env.ONLINECOMPILER_LIVE_TEST === 'true') {
      assert.ok(process.env.ONLINECOMPILER_API_KEY, 'live execution requires the configured provider key');
      const livePage = await get('/assessment');
      const liveHtml = await livePage.text();
      const liveKey = liveHtml.match(/name="submissionKey" value="([^"]+)"/)?.[1];
      assert.ok(liveKey);
      assert.equal(liveHtml.includes(process.env.ONLINECOMPILER_API_KEY), false, 'provider key is absent from rendered HTML');
      const liveSubmission = await post('/assessment/python-sum/submit-code', {
        _csrf: csrfFrom(liveHtml),
        submissionKey: liveKey,
        providerConsent: 'yes',
        code: 'n = int(input())\nvalues = list(map(int, input().split())) if n else []\nprint(sum(values))',
      });
      const liveResultHtml = await liveSubmission.text();
      const safeResultMessage = liveResultHtml.match(/<p class="lead">([^<]*)<\/p>/)?.[1] || 'No result message';
      assert.equal(liveSubmission.status, 200, `Live assessment returned HTTP ${liveSubmission.status}: ${safeResultMessage}`);
      assert.match(liveResultHtml, /100\.00%/);
      assert.match(liveResultHtml, /SkillTrack progress record was saved/);
      assert.equal(liveResultHtml.includes(process.env.ONLINECOMPILER_API_KEY), false);
      const liveAttempt = await StudentAssessment.findOne({
        student: user._id,
        challengeId: 'python-sum',
        submissionKey: liveKey,
      });
      assert.equal(liveAttempt.passed, true);
      assert.equal(liveAttempt.passedTests, 4);
      assert.equal(liveAttempt.score, 100);
      assert.ok(await SkillTrackProgress.findOne({ student: user._id, assessment: liveAttempt._id }));
      user = await User.findById(user._id);
      assert.ok(user.assessedSkills.some((skill) => String(skill) === String(pythonSkill._id)));
    }

    const assessmentResponse = await post('/assessment/python-basics/submit', {
      _csrf: csrfFrom(assessmentHtml),
      answer_0: 'sum',
      answer_1: 'zero',
    });
    assert.equal(assessmentResponse.status, 200);
    assert.match(await assessmentResponse.text(), /Assessment passed/);
    user = await User.findOne({ email });
    assert.ok(user.assessedSkills.some((skill) => String(skill) === String(pythonSkill._id)));
    const attempt = await StudentAssessment.findOne({
      student: user._id,
      challengeId: 'python-basics',
      passed: true,
    });
    assert.equal(attempt.passed, true);
    assert.equal(attempt.passedTests, 2);
    assert.equal(await StudentAssessment.countDocuments({
      student: user._id,
      challengeId: 'python-basics',
    }), 3);

    const assistantPage = await get('/assistant');
    assert.equal(assistantPage.status, 200);
    const assistantHtml = await assistantPage.text();
    assert.match(assistantHtml, /name="_csrf"/);
    const savedAiEnvironment = {
      AI_API_KEY: process.env.AI_API_KEY,
      AI_API_URL: process.env.AI_API_URL,
      AI_MODEL: process.env.AI_MODEL,
    };
    let assistantReply;
    let assistantReplyHtml;
    try {
      delete process.env.AI_API_KEY;
      delete process.env.AI_API_URL;
      delete process.env.AI_MODEL;
      assistantReply = await post('/assistant', {
        _csrf: csrfFrom(assistantHtml),
        question: 'What should I learn next?',
      });
      assistantReplyHtml = await assistantReply.text();
    } finally {
      for (const [key, value] of Object.entries(savedAiEnvironment)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
    assert.equal(assistantReply.status, 200);
    assert.match(assistantReplyHtml, /Offline profile-based guidance/);
    assert.match(assistantReplyHtml, /Web Developer/);
    const invalidAssistantQuestion = await post('/assistant', {
      _csrf: csrfFrom(assistantHtml),
      question: 'x'.repeat(1001),
    });
    assert.equal(invalidAssistantQuestion.status, 400);

    const progressStateResponse = await get('/learning/progress/state');
    assert.equal(progressStateResponse.status, 200);
    assert.match(progressStateResponse.headers.get('cache-control'), /private, no-store/);
    const progressState = await progressStateResponse.json();
    assert.ok(progressState.csrfToken);
    const progressSync = await postJson(
      '/learning/progress/sync',
      { completedSkills: ['html', 'css'], baseCompletedSkills: [] },
      progressState.csrfToken,
    );
    assert.equal(progressSync.status, 200);
    const syncResult = await progressSync.json();
    assert.equal(syncResult.synced, 2);
    assert.deepEqual(syncResult.completedSkills.sort(), ['css', 'html']);
    assert.deepEqual(syncResult.conflicts, []);
    const duplicateProgressSync = await postJson(
      '/learning/progress/sync',
      { completedSkills: ['html', 'css'], baseCompletedSkills: [] },
      progressState.csrfToken,
    );
    assert.equal(duplicateProgressSync.status, 200);
    const duplicateResult = await duplicateProgressSync.json();
    assert.equal(duplicateResult.synced, 0);
    assert.deepEqual(duplicateResult.conflicts, []);
    assert.equal(await LearningProgress.countDocuments({ student: user._id }), 2);
    const conflictSync = await postJson(
      '/learning/progress/sync',
      { completedSkills: ['javascript'], baseCompletedSkills: [] },
      progressState.csrfToken,
    );
    assert.equal(conflictSync.status, 200);
    const conflictResult = await conflictSync.json();
    assert.deepEqual(conflictResult.conflicts.sort(), ['css', 'html']);
    assert.deepEqual(conflictResult.completedSkills.sort(), ['css', 'html', 'javascript']);
    assert.equal(conflictResult.conflictResolution, 'completion-wins');
    assert.equal(await LearningProgress.countDocuments({ student: user._id }), 3);
    const combinedSkillTrackPage = await get('/skilltrack');
    const combinedSkillTrackHtml = await combinedSkillTrackPage.text();
    assert.match(combinedSkillTrackHtml, /Coding assessment progress/);
    assert.match(combinedSkillTrackHtml, /Offline lesson progress/);
    assert.match(combinedSkillTrackHtml, /HTML\s*<\/strong> completed/);
    assert.match(combinedSkillTrackHtml, /Repo:/, 'SkillTrack renders repository header');
    assert.match(combinedSkillTrackHtml, /commit\s+[0-9a-f]{8}/, 'SkillTrack renders git commit hashes');
    assert.match(combinedSkillTrackHtml, /🏷️\s*v1\.0/, 'SkillTrack renders milestone tags');
    assert.match(combinedSkillTrackHtml, /✓ Verified Assessment/, 'SkillTrack renders verified assessment badge');
    assert.match(combinedSkillTrackHtml, /\s*python-developer/, 'SkillTrack renders career path branches');

    // Assessment-to-commit integration check
    const assessmentCommits = await SkillTrackEntry.find({
      student: user._id,
      entryType: 'assessment',
    }).lean();
    assert.ok(assessmentCommits.length >= 1, 'actual student assessments must integrate as commits in SkillTrack');
    const verifiedCommit = assessmentCommits.find((c) => c.isVerified);
    assert.ok(verifiedCommit, 'verified assessment commit must exist');
    assert.match(verifiedCommit.commitMessage, /Passed/);
    assert.ok(verifiedCommit.score > 0);
    assert.match(verifiedCommit.tag, /verified/);
    const invalidProgressSync = await postJson(
      '/learning/progress/sync',
      { completedSkills: ['not-a-lesson'], baseCompletedSkills: [] },
      progressState.csrfToken,
    );
    assert.equal(invalidProgressSync.status, 400);

    const logoutPage = await get('/profile');
    const logoutHtml = await logoutPage.text();
    const logout = await post('/auth/logout', { _csrf: csrfFrom(logoutHtml) });
    assert.equal(logout.status, 303);
    assert.equal(logout.headers.get('location'), '/');

    const loginPage = await get('/auth/login');
    const loginHtml = await loginPage.text();
    const invalidLogin = await post('/auth/login', {
      _csrf: csrfFrom(loginHtml),
      email,
      password: 'incorrect-password',
    });
    assert.equal(invalidLogin.status, 401);

    const login = await post('/auth/login', {
      _csrf: csrfFrom(loginHtml),
      email,
      password: 'a-long-phase-two-password',
    });
    assert.equal(login.status, 303);
    assert.equal(login.headers.get('location'), '/dashboard');

    const persistedProfile = await get('/profile');
    const persistedHtml = await persistedProfile.text();
    assert.equal(persistedProfile.status, 200);
    assert.match(persistedHtml, /value="English" selected/);
    assert.match(persistedHtml, /value="Web Developer" checked/);

    // Phase 8: Cryptographic Skill Passport integration
    const credentialsPage = await get('/credentials');
    assert.equal(credentialsPage.status, 200);
    const credentialsHtml = await credentialsPage.text();
    assert.match(credentialsHtml, /Skill Passport/);
    assert.match(credentialsHtml, /Cryptographic credentials/);
    assert.match(credentialsHtml, /Ed25519/);
    assert.match(credentialsHtml, /Scan to verify/);

    const passportRedirect = await get('/passport');
    assert.equal(passportRedirect.status, 301);
    assert.equal(passportRedirect.headers.get('location'), '/credentials');

    const studentCredentials = await Credential.find({ student: user._id }).sort({ createdAt: 1 }).lean();
    assert.ok(studentCredentials.length >= 1, 'passed assessment must generate a cryptographic credential');
    const firstCredential = studentCredentials[0];
    assert.equal(firstCredential.issuer, 'VidyaChain');
    assert.equal(firstCredential.status, 'verified');
    assert.equal(firstCredential.previousHash, 'genesis');
    assert.match(firstCredential.evidenceHash, /^[0-9a-f]{64}$/);
    assert.ok(firstCredential.signature);

    // Public verification endpoint
    const verifyPage = await fetch(`${baseUrl}/verify/${firstCredential._id}`);
    assert.equal(verifyPage.status, 200);
    const verifyHtml = await verifyPage.text();
    assert.match(verifyHtml, /Valid cryptographic credential/);
    assert.match(verifyHtml, /Ed25519/);
    assert.match(verifyHtml, new RegExp(firstCredential.evidenceHash));

    // Public preview endpoint with query param
    const previewPage = await fetch(`${baseUrl}/verify/preview?verificationId=${firstCredential._id}`);
    assert.equal(previewPage.status, 200);
    assert.match(await previewPage.text(), /Valid cryptographic credential/);

    // Public verification of invalid/nonexistent credential
    const invalidVerifyPage = await fetch(`${baseUrl}/verify/not-an-id`);
    assert.equal(invalidVerifyPage.status, 200);
    assert.match(await invalidVerifyPage.text(), /Credential invalid or unavailable/);

    // Phase 9: Opportunity Matching
    const oppsPage = await get('/opportunities');
    assert.equal(oppsPage.status, 200);
    const oppsHtml = await oppsPage.text();
    assert.match(oppsHtml, /Internships & career opportunities/);
    assert.match(oppsHtml, /Bengal Infotech Labs/);
    assert.match(oppsHtml, /Match/);
    assert.match(oppsHtml, /Bridge your skill gap/);

    // Phase 9: Student Skill Portfolio & Privacy Controls
    const portfolioPage = await get(`/portfolio/${user._id}`);
    assert.equal(portfolioPage.status, 200);
    const portfolioHtml = await portfolioPage.text();
    assert.match(portfolioHtml, /Student Skill Portfolio/);
    assert.match(portfolioHtml, /Verified & Assessed Skills/);
    assert.match(portfolioHtml, /Cryptographic Skill Passport/);
    assert.match(portfolioHtml, /Git-inspired Learning History/);

    // Set portfolio to private
    const privateToggle = await post('/portfolio/privacy', {
      _csrf: csrfFrom(portfolioHtml),
      privacy: 'private',
    });
    assert.equal(privateToggle.status, 303);
    const userDocPrivate = await User.findById(user._id);
    assert.equal(userDocPrivate.portfolioPrivacy, 'private');

    // Anonymous fetch of private portfolio
    const anonPortfolio = await fetch(`${baseUrl}/portfolio/${user._id}`);
    assert.equal(anonPortfolio.status, 200);
    const anonPortfolioHtml = await anonPortfolio.text();
    assert.match(anonPortfolioHtml, /Private Student Portfolio/);

    // Restore portfolio to public
    const publicToggle = await post('/portfolio/privacy', {
      _csrf: csrfFrom(portfolioHtml),
      privacy: 'public',
    });
    assert.equal(publicToggle.status, 303);

    // Phase 9: Recruiter Dashboard
    const recruiterPage = await fetch(`${baseUrl}/recruiter`);
    assert.equal(recruiterPage.status, 200);
    const recruiterHtml = await recruiterPage.text();
    assert.match(recruiterHtml, /Recruiter dashboard/);
    assert.match(recruiterHtml, /Active Opportunities/);
    assert.match(recruiterHtml, /Candidate Discovery Pool/);
    assert.match(recruiterHtml, new RegExp(user.name));
    assert.match(recruiterHtml, /Quick credential verification/);

    // Recruiter search with skill filter
    const filteredRecruiter = await fetch(`${baseUrl}/recruiter?skillFilter=python`);
    assert.equal(filteredRecruiter.status, 200);
    assert.match(await filteredRecruiter.text(), new RegExp(user.name));

    const tokenFailure = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(cookie ? { cookie } : {}),
      },
      body: new URLSearchParams({ _csrf: 'invalid-token' }),
    });
    assert.equal(tokenFailure.status, 403);

    const finalLogout = await post('/auth/logout', { _csrf: csrfFrom(persistedHtml) });
    assert.equal(finalLogout.status, 303);
    const anonymousCareerPage = await get('/career');
    assert.equal(anonymousCareerPage.status, 302);
    assert.equal(anonymousCareerPage.headers.get('location'), '/auth/login');
    const anonymousSkillTrackPage = await get('/skilltrack');
    assert.equal(anonymousSkillTrackPage.status, 302);
    assert.equal(anonymousSkillTrackPage.headers.get('location'), '/auth/login');
    const anonymousAssistant = await get('/assistant');
    assert.equal(anonymousAssistant.status, 302);
    const anonymousCredentials = await get('/credentials');
    assert.equal(anonymousCredentials.status, 302);
    assert.equal(anonymousCredentials.headers.get('location'), '/auth/login');
    const anonymousOpportunities = await get('/opportunities');
    assert.equal(anonymousOpportunities.status, 302);
    assert.equal(anonymousOpportunities.headers.get('location'), '/auth/login');
  } finally {
    const testUser = await User.findOne({ email }).select('_id');
    if (testUser) {
      await StudentAssessment.deleteMany({ student: testUser._id });
      await SkillTrackProgress.deleteMany({ student: testUser._id });
      await SkillTrackEntry.deleteMany({ student: testUser._id });
      await LearningProgress.deleteMany({ student: testUser._id });
      await Credential.deleteMany({ student: testUser._id });
    }
    await SkillTrackEntry.deleteMany({ student: privateStudentId });
    await User.deleteOne({ email });
  }
});
