const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
    index: true,
  },
  skillName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentAssessment',
    required: true,
  },
  assessmentId: {
    type: String,
    required: true,
    trim: true,
  },
  assessmentResult: {
    type: String,
    required: true,
    default: 'passed',
  },
  evidenceHash: {
    type: String,
    required: true,
    trim: true,
    match: /^[a-f0-9]{64}$/,
    index: true,
  },
  previousHash: {
    type: String,
    required: true,
    trim: true,
  },
  issuer: {
    type: String,
    required: true,
    default: 'VidyaChain',
  },
  signature: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['verified', 'revoked'],
    default: 'verified',
    required: true,
  },
  issuedAt: {
    type: String,
    trim: true,
  },
  qrCode: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
  strict: 'throw',
  collection: 'credentials',
});

credentialSchema.index({ student: 1, assessment: 1 }, { unique: true });
credentialSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.models.Credential
  || mongoose.model('Credential', credentialSchema);
