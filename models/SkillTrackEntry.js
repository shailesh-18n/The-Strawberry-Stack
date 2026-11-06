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
}, {
  timestamps: true,
  strict: 'throw',
  collection: 'skilltrackentries',
});

skillTrackEntrySchema.index({ student: 1, createdAt: -1 });
skillTrackEntrySchema.index({ student: 1, skill: 1, createdAt: -1 });

module.exports = mongoose.models.SkillTrackEntry
  || mongoose.model('SkillTrackEntry', skillTrackEntrySchema);
