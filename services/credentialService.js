const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const Credential = require('../models/Credential');
const { getCredentialById, listCredentials } = require('../utils/store');

function ensureSigningKeys() {
  const keyPath = path.join(process.cwd(), '.keys');
  const exists = fs.existsSync(keyPath);

  if (!exists) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(keyPath + '.pub', publicKey.export({ type: 'spki', format: 'pem' }).toString());
    fs.writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }).toString());
  }

  const privatePem = fs.readFileSync(keyPath, 'utf8');
  const publicPem = fs.readFileSync(keyPath + '.pub', 'utf8');

  return {
    privateKey: crypto.createPrivateKey(privatePem),
    publicKey: crypto.createPublicKey(publicPem),
    publicKeyPem: publicPem,
  };
}

function computeEvidenceHash(payload) {
  const userId = String(payload.userId || payload.studentId || payload.student?._id || payload.student || '');
  const assessmentId = String(payload.assessmentId || payload.assessment?._id || payload.assessment || '');
  const issuedAt = typeof payload.issuedAt === 'object' && payload.issuedAt?.toISOString
    ? payload.issuedAt.toISOString()
    : String(payload.issuedAt || (payload.createdAt?.toISOString ? payload.createdAt.toISOString() : payload.createdAt) || '');

  const body = {
    userId,
    studentName: payload.studentName || '',
    skillName: payload.skillName || '',
    assessmentId,
    assessmentResult: payload.assessmentResult || 'passed',
    previousHash: payload.previousHash || 'genesis',
    issuedAt,
  };

  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

function signEvidenceHash(evidenceHash) {
  const { privateKey } = ensureSigningKeys();
  return crypto.sign(null, Buffer.from(evidenceHash), privateKey).toString('hex');
}

function verifySignature(evidenceHash, signature) {
  try {
    const { publicKey } = ensureSigningKeys();
    const signatureBuffer = Buffer.from(signature, 'hex');
    return crypto.verify(null, Buffer.from(evidenceHash), publicKey, signatureBuffer);
  } catch {
    return false;
  }
}

function createCredentialRecord({
  userId,
  studentName,
  skillName,
  assessmentId,
  assessmentResult,
  previousHash = null,
  skillId = null,
}) {
  const previousRecordHash = previousHash || 'genesis';
  const issuedAt = new Date().toISOString();
  const body = {
    userId: String(userId),
    studentName,
    skillName,
    assessmentId: String(assessmentId),
    assessmentResult,
    previousHash: previousRecordHash,
    issuedAt,
  };

  const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const signature = signEvidenceHash(evidenceHash);

  const credential = {
    id: crypto.randomUUID(),
    userId: String(userId),
    studentName,
    skillName,
    skillId,
    assessmentId: String(assessmentId),
    assessmentResult,
    evidenceHash,
    previousHash: previousRecordHash,
    issuer: 'VidyaChain',
    signature,
    status: 'verified',
    createdAt: issuedAt,
  };

  return credential;
}

async function createQrCodeDataUrl(credentialId, host = '') {
  const verificationUrl = host
    ? `${host}/verify/${credentialId}`
    : `vidyachain://verify/${credentialId}`;
  return QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 200,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  });
}

async function issueMongoCredential({
  student,
  skill,
  assessment,
  assessmentResult = 'passed',
}) {
  const studentId = student._id || student;
  const skillId = skill._id || skill;
  const assessmentId = assessment._id || assessment;

  // Idempotency: check if already issued
  const existing = await Credential.findOne({ student: studentId, assessment: assessmentId });
  if (existing) {
    if (!existing.qrCode) {
      existing.qrCode = await createQrCodeDataUrl(existing._id);
      await existing.save();
    }
    return existing;
  }

  // Cryptographic hash chain: find latest credential for this student
  const latestCred = await Credential.findOne({ student: studentId })
    .sort({ createdAt: -1, _id: -1 })
    .select('evidenceHash')
    .lean();

  const previousHash = latestCred?.evidenceHash || 'genesis';
  const issuedAt = new Date().toISOString();

  const studentName = student.name || 'Student';
  const skillName = skill.name || 'Skill';
  const challengeId = assessment.challengeId || 'assessment';

  const body = {
    userId: String(studentId),
    studentName,
    skillName,
    assessmentId: challengeId,
    assessmentResult,
    previousHash,
    issuedAt,
  };

  const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const signature = signEvidenceHash(evidenceHash);

  const doc = await Credential.create({
    student: studentId,
    studentName,
    skill: skillId,
    skillName,
    assessment: assessmentId,
    assessmentId: challengeId,
    assessmentResult,
    evidenceHash,
    previousHash,
    issuer: 'VidyaChain',
    signature,
    status: 'verified',
    issuedAt,
    createdAt: new Date(issuedAt),
  });

  const qrCode = await createQrCodeDataUrl(doc._id).catch(() => '');
  doc.qrCode = qrCode;
  await doc.save();

  return doc;
}

function verifyCredentialPayload(credential) {
  if (!credential) {
    return { valid: false, reason: 'Credential not found.' };
  }

  const issuedAt = credential.issuedAt
    || (typeof credential.createdAt === 'object' && credential.createdAt.toISOString
      ? credential.createdAt.toISOString()
      : String(credential.createdAt || credential.issuedAt || ''));

  const payload = {
    userId: String(credential.userId || credential.student?._id || credential.student || ''),
    studentName: credential.studentName,
    skillName: credential.skillName,
    assessmentId: String(credential.assessmentId || ''),
    assessmentResult: credential.assessmentResult,
    previousHash: credential.previousHash,
    issuedAt,
  };

  const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  if (evidenceHash !== credential.evidenceHash) {
    return {
      valid: false,
      reason: 'Evidence hash tampering detected: computed hash does not match stored evidence hash.',
      evidenceHash,
      storedHash: credential.evidenceHash,
    };
  }

  const valid = verifySignature(evidenceHash, credential.signature);

  return {
    valid,
    credential,
    hashChain: evidenceHash,
    previousHash: credential.previousHash,
    issuer: credential.issuer,
    algorithm: 'Ed25519',
    reason: valid ? null : 'Cryptographic signature verification failed.',
  };
}

async function verifyCredentialAsync(credentialId) {
  if (!credentialId) {
    return { valid: false, reason: 'No credential ID provided.' };
  }

  // First check Mongo if valid ObjectId
  if (mongoose.isValidObjectId(credentialId)) {
    const mongoDoc = await Credential.findById(credentialId)
      .populate('student', 'name email')
      .populate('skill', 'name slug')
      .lean();
    if (mongoDoc) {
      return verifyCredentialPayload(mongoDoc);
    }
  }

  // Fallback to in-memory store for unit test records
  const memoryDoc = getCredentialById(credentialId);
  if (memoryDoc) {
    return verifyCredentialPayload(memoryDoc);
  }

  return { valid: false, reason: 'Credential not found.' };
}

function verifyCredential(credentialId) {
  const credential = getCredentialById(credentialId);
  if (!credential) {
    return { valid: false, reason: 'Credential not found.' };
  }
  return verifyCredentialPayload(credential);
}

module.exports = {
  computeEvidenceHash,
  createCredentialRecord,
  createQrCodeDataUrl,
  ensureSigningKeys,
  issueMongoCredential,
  signEvidenceHash,
  verifyCredential,
  verifyCredentialAsync,
  verifyCredentialPayload,
  verifySignature,
  listCredentials,
};
