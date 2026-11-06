const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  number: { type: Number, required: true, min: 1 },
  hidden: { type: Boolean, required: true },
  verdict: { type: String, required: true, maxlength: 40 },
  passed: { type: Boolean, required: true },
  output: { type: String, maxlength: 1200, default: '' },
  error: { type: String, maxlength: 1200, default: '' },
}, { _id: false, strict: 'throw' });

const studentAssessmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  challengeId: { type: String, required: true, trim: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  submissionType: { type: String, enum: ['quiz', 'code'], default: 'quiz', required: true },
  passed: { type: Boolean, required: true },
  passedTests: { type: Number, required: true, min: 0 },
  totalTests: { type: Number, required: true, min: 1 },
  score: { type: Number, min: 0, max: 100, default: 0 },
  verdict: { type: String, maxlength: 40, default: '' },
  submissionKey: { type: String, maxlength: 100 },
  providerSubmissionId: { type: String, maxlength: 100, default: '' },
  sourceHash: {
    type: String,
    default: '',
    validate: (value) => value === '' || /^[a-f0-9]{64}$/.test(value),
  },
  compileError: { type: String, maxlength: 1200, default: '' },
  testResults: { type: [testResultSchema], default: [] },
}, { timestamps: true, strict: 'throw' });

studentAssessmentSchema.index(
  { student: 1, submissionKey: 1 },
  { unique: true, partialFilterExpression: { submissionKey: { $type: 'string' } } },
);

module.exports = mongoose.models.StudentAssessment
  || mongoose.model('StudentAssessment', studentAssessmentSchema);
