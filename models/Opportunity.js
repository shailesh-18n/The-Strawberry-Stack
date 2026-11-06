const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  company: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  type: {
    type: String,
    enum: ['Internship', 'Full-time', 'Part-time', 'Apprenticeship'],
    default: 'Internship',
  },
  stipend: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  requiredSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
  }],
  preferredSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
  }],
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
}, {
  timestamps: true,
  strict: 'throw',
  collection: 'opportunities',
});

opportunitySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.Opportunity
  || mongoose.model('Opportunity', opportunitySchema);

