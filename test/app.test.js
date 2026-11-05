const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluatePythonChallenge } = require('../services/assessmentService');
const { verifyCredential, createCredentialRecord } = require('../services/credentialService');
const { createCredential } = require('../utils/store');
const app = require('../app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('python challenge evaluation passes valid submission', () => {
  const result = evaluatePythonChallenge('python-basics', 'def solve(data):\n    return sum(data)\n');
  assert.equal(result.success, true);
  assert.equal(result.totalTests, 3);
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

test('home page renders the Phase 1 foundation with reusable layout', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /VidyaChain is ready for its next phase/);
  assert.match(html, /Phase 1 foundation/);
  assert.match(html, /<main class="container py-5">/);
  assert.match(html, /bootstrap@5\.3\.3/);
});

test('unknown routes render a shared-layout 404 page', async () => {
  const response = await fetch(`${baseUrl}/not-a-route`);
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.match(html, /Phase 1 foundation/);
  assert.match(html, /Page not found/);
});

test('liveness does not depend on MongoDB', async () => {
  const response = await fetch(`${baseUrl}/health/live`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('readiness reports a disconnected database', async () => {
  const response = await fetch(`${baseUrl}/health/ready`);

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: 'not_ready',
    database: 'disconnected',
  });
});

test('security headers are applied', async () => {
  const response = await fetch(baseUrl);

  assert.equal(response.headers.get('x-powered-by'), null);
  assert.match(response.headers.get('content-security-policy'), /cdn\.jsdelivr\.net/);
  assert.ok(response.headers.get('x-content-type-options'));
});

test('static public assets are served', async () => {
  const response = await fetch(`${baseUrl}/public/css/style.css`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
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
