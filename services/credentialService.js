const crypto = require('crypto');
const QRCode = require('qrcode');
const { getCredentialById, listCredentials } = require('../utils/store');

function ensureSigningKeys() {
  const keyPath = require('path').join(process.cwd(), '.keys');
  const exists = require('fs').existsSync(keyPath);

  if (!exists) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    require('fs').writeFileSync(keyPath + '.pub', publicKey.export({ type: 'spki', format: 'pem' }).toString());
    require('fs').writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }).toString());
  }

  const privatePem = require('fs').readFileSync(keyPath, 'utf8');
  const publicPem = require('fs').readFileSync(keyPath + '.pub', 'utf8');

  return {
    privateKey: crypto.createPrivateKey(privatePem),
    publicKey: crypto.createPublicKey(publicPem),
  };
}

function createCredentialRecord({ userId, studentName, skillName, assessmentId, assessmentResult, previousHash = null }) {
  const previousRecordHash = previousHash || 'genesis';
  const issuedAt = new Date().toISOString();
  const body = {
    userId,
    studentName,
    skillName,
    assessmentId,
    assessmentResult,
    previousHash: previousRecordHash,
    issuedAt,
  };

  const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const { privateKey } = ensureSigningKeys();
  const signature = crypto.sign(null, Buffer.from(evidenceHash), privateKey).toString('hex');

  const credential = {
    id: crypto.randomUUID(),
    userId,
    studentName,
    skillName,
    assessmentId,
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

async function createQrCodeDataUrl(credentialId) {
  const credential = getCredentialById(credentialId);
  if (!credential) {
    throw new Error('Credential not found.');
  }
  return QRCode.toDataURL(`vidyachain://verify/${credential.id}`);
}

function verifyCredential(credentialId) {
  const credential = getCredentialById(credentialId);
  if (!credential) {
    return { valid: false, reason: 'Credential not found.' };
  }

  const { publicKey } = ensureSigningKeys();
  const payload = {
    userId: credential.userId,
    studentName: credential.studentName,
    skillName: credential.skillName,
    assessmentId: credential.assessmentId,
    assessmentResult: credential.assessmentResult,
    previousHash: credential.previousHash,
    issuedAt: credential.createdAt,
  };

  const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const signatureBuffer = Buffer.from(credential.signature, 'hex');
  const valid = crypto.verify(null, Buffer.from(evidenceHash), publicKey, signatureBuffer);

  return {
    valid,
    credential,
    hashChain: evidenceHash,
    issuer: credential.issuer,
  };
}

module.exports = {
  createCredentialRecord,
  createQrCodeDataUrl,
  verifyCredential,
  listCredentials,
};
