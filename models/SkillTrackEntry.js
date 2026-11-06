const crypto = require('node:crypto');
const mongoose = require('mongoose');

const skillTrackEntrySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  previousLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  commitMessage: { type: String, trim: true, minlength: 3, maxlength: 100, required: true },
  changeSummary: { type: String, trim: true, minlength: 3, maxlength: 500, required: true },
  commitHash: {
    type: String,
    trim: true,
    default: () => crypto.randomBytes(4).toString('hex'),
  },
  branch: {
    type: String,
    trim: true,
    default: 'main',
    maxlength: 60,
  },
  tag: {
    type: String,
    trim: true,
    default: null,
    maxlength: 50,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  entryType: {
    type: String,
    enum: ['milestone', 'assessment', 'lesson'],
    default: 'milestone',
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentAssessment',
    default: null,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  previousScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  scoreDelta: {
    type: Number,
    default: null,
  },
  diff: {
    type: String,
    trim: true,
    maxlength: 200,
    default: null,
  },
  status: {
    type: String,
    enum: ['initial', 'improved', 'regressed', 'unchanged'],
    default: 'initial',
  },
}, {
  timestamps: true,
  strict: 'throw',
  collection: 'skilltrackentries',
});

skillTrackEntrySchema.index({ student: 1, createdAt: -1 });
skillTrackEntrySchema.index({ student: 1, skill: 1, createdAt: -1 });
skillTrackEntrySchema.index({ student: 1, branch: 1, createdAt: -1 });
skillTrackEntrySchema.index({ student: 1, assessment: 1 });

module.exports = mongoose.models.SkillTrackEntry
  || mongoose.model('SkillTrackEntry', skillTrackEntrySchema);
