const mongoose = require('mongoose');

const skillTrackProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentAssessment', required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  passed: { type: Boolean, required: true },
  summary: { type: String, trim: true, maxlength: 240, required: true },
}, {
  timestamps: true,
  strict: 'throw',
  collection: 'skilltrackprogress',
});

skillTrackProgressSchema.index({ student: 1, assessment: 1 }, { unique: true });
skillTrackProgressSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.models.SkillTrackProgress
  || mongoose.model('SkillTrackProgress', skillTrackProgressSchema);
