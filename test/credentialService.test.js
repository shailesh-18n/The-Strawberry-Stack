const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
  computeEvidenceHash,
  createCredentialRecord,
  createQrCodeDataUrl,
  ensureSigningKeys,
  signEvidenceHash,
  verifyCredential,
  verifyCredentialPayload,
  verifySignature,
} = require('../services/credentialService');
const { createCredential } = require('../utils/store');

test('ensureSigningKeys creates or loads valid Ed25519 keys', () => {
  const keys = ensureSigningKeys();
  assert.ok(keys.privateKey);
  assert.ok(keys.publicKey);
  assert.ok(keys.publicKeyPem.includes('PUBLIC KEY'));
});

test('computeEvidenceHash produces a deterministic 64-character SHA-256 hex string', () => {
  const payload = {
    userId: 'student-123',
    studentName: 'Vivek Das',
    skillName: 'Python basics',
    assessmentId: 'challenge-python-sum',
    assessmentResult: 'passed',
    previousHash: 'genesis',
    issuedAt: '2026-11-06T00:00:00.000Z',
  };

  const hash1 = computeEvidenceHash(payload);
  const hash2 = computeEvidenceHash(payload);

  assert.equal(hash1, hash2);
  assert.match(hash1, /^[0-9a-f]{64}$/);
});

test('signEvidenceHash and verifySignature verify valid signatures and reject tampered signatures', () => {
  const evidenceHash = crypto.createHash('sha256').update('test-payload').digest('hex');
  const signature = signEvidenceHash(evidenceHash);

  assert.ok(signature);
  assert.equal(verifySignature(evidenceHash, signature), true);

  // Tampered payload
  const tamperedHash = crypto.createHash('sha256').update('tampered-payload').digest('hex');
  assert.equal(verifySignature(tamperedHash, signature), false);
});

test('createCredentialRecord generates a valid cryptographic credential linked to genesis', () => {
  const credential = createCredentialRecord({
    userId: 'student-abc',
    studentName: 'Vivek Das',
    skillName: 'JavaScript fundamentals',
    assessmentId: 'js-quiz-1',
    assessmentResult: 'passed',
  });

  assert.ok(credential.id);
  assert.equal(credential.previousHash, 'genesis');
  assert.equal(credential.issuer, 'VidyaChain');
  assert.equal(credential.status, 'verified');
  assert.match(credential.evidenceHash, /^[0-9a-f]{64}$/);
  assert.ok(credential.signature);

  const verification = verifyCredentialPayload(credential);
  assert.equal(verification.valid, true);
  assert.equal(verification.issuer, 'VidyaChain');
});

test('verifyCredentialPayload detects tampering with student name or assessment result', () => {
  const credential = createCredentialRecord({
    userId: 'student-xyz',
    studentName: 'Vivek Das',
    skillName: 'Python basics',
    assessmentId: 'challenge-1',
    assessmentResult: 'passed',
  });

  // Tamper with student name
  const tamperedStudent = { ...credential, studentName: 'Imposter Student' };
  const check1 = verifyCredentialPayload(tamperedStudent);
  assert.equal(check1.valid, false);
  assert.match(check1.reason, /Evidence hash tampering detected/);

  // Tamper with assessment result
  const tamperedResult = { ...credential, assessmentResult: 'failed' };
  const check2 = verifyCredentialPayload(tamperedResult);
  assert.equal(check2.valid, false);
  assert.match(check2.reason, /Evidence hash tampering detected/);
});

test('cryptographic hash chain links consecutive credentials', () => {
  const cred1 = createCredentialRecord({
    userId: 'student-chain',
    studentName: 'Vivek Das',
    skillName: 'HTML',
    assessmentId: 'html-1',
    assessmentResult: 'passed',
    previousHash: 'genesis',
  });
  assert.equal(cred1.previousHash, 'genesis');

  const cred2 = createCredentialRecord({
    userId: 'student-chain',
    studentName: 'Vivek Das',
    skillName: 'CSS',
    assessmentId: 'css-1',
    assessmentResult: 'passed',
    previousHash: cred1.evidenceHash,
  });
  assert.equal(cred2.previousHash, cred1.evidenceHash);

  assert.equal(verifyCredentialPayload(cred1).valid, true);
  assert.equal(verifyCredentialPayload(cred2).valid, true);
});

test('createQrCodeDataUrl generates a valid image/png data URL', async () => {
  const qrUrl = await createQrCodeDataUrl('credential-uuid-1234');
  assert.match(qrUrl, /^data:image\/png;base64,/);
});

