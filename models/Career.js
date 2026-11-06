const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  level: { type: String, enum: ['starter', 'intermediate', 'advanced'], required: true },
  interestTags: [{ type: String, trim: true, lowercase: true, maxlength: 80 }],
  requiredSkills: [{
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    sequence: { type: Number, required: true, min: 0 },
  }],
}, { timestamps: true, strict: 'throw' });

careerSchema.index({ 'requiredSkills.skill': 1 });

module.exports = mongoose.models.Career || mongoose.model('Career', careerSchema);
