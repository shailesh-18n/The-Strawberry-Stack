const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 500 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  level: { type: String, enum: ['starter', 'intermediate', 'advanced'], required: true },
  aliases: [{ type: String, trim: true, lowercase: true, maxlength: 80 }],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
  learningActivity: { type: String, required: true, maxlength: 500 },
}, { timestamps: true, strict: 'throw' });

module.exports = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
