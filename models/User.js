const mongoose = require('mongoose');

const profileListValidator = {
  validator: (items) => items.length <= 10,
  message: 'A maximum of 10 items is allowed.',
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  preferredLanguage: {
    type: String,
    enum: ['Bengali', 'English', 'Hindi', 'Kannada'],
    default: 'Bengali',
    required: true,
  },
  interests: {
    type: [{ type: String, trim: true, maxlength: 80 }],
    default: [],
    validate: profileListValidator,
  },
  aspirations: {
    type: [{ type: String, trim: true, maxlength: 80 }],
    default: [],
    validate: profileListValidator,
  },
  skillInventory: {
    type: [{ type: String, trim: true, maxlength: 80 }],
    default: [],
    validate: profileListValidator,
  },
  assessedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
  }],
  educationLevel: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  learningPreferences: {
    type: [{ type: String, trim: true, maxlength: 80 }],
    default: [],
    validate: profileListValidator,
  },
  accessNeeds: {
    type: [{ type: String, trim: true, maxlength: 80 }],
    default: [],
    validate: profileListValidator,
  },
  profileSummary: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },
  role: {
    type: String,
    enum: ['student', 'recruiter'],
    default: 'student',
  },
  company: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  portfolioPrivacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
}, {
  timestamps: true,
  strict: 'throw',
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
