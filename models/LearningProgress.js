const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  completedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
  strict: 'throw',
});

learningProgressSchema.index({ student: 1, skill: 1 }, { unique: true });

module.exports = mongoose.models.LearningProgress
  || mongoose.model('LearningProgress', learningProgressSchema);
