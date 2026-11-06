const express = require('express');
const mongoose = require('mongoose');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const LearningProgress = require('../models/LearningProgress');
const Skill = require('../models/Skill');
const SkillTrackEntry = require('../models/SkillTrackEntry');
const SkillTrackProgress = require('../models/SkillTrackProgress');

const router = express.Router();
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const MAX_ENTRIES = 50;

async function loadSkillTrack(studentId) {
  const [skills, entries, assessmentProgress, lessonProgress] = await Promise.all([
    Skill.find().select('name slug').sort({ name: 1 }).lean(),
    SkillTrackEntry.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(MAX_ENTRIES)
      .populate('skill', 'name slug')
      .lean(),
    SkillTrackProgress.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(MAX_ENTRIES)
      .populate('skill', 'name slug')
      .lean(),
    LearningProgress.find({ student: studentId })
      .sort({ completedAt: -1 })
      .limit(MAX_ENTRIES)
      .populate('skill', 'name slug')
      .lean(),
  ]);
  return { skills, entries, assessmentProgress, lessonProgress };
}

async function renderSkillTrack(request, response, status = 200, error = null) {
  const data = await loadSkillTrack(request.student._id);
  return response.status(status).render('skilltrack/log', {
    title: 'SkillTrack',
    user: request.student,
    ...data,
    error,
    saved: request.query.saved === '1',
    form: request.body || {},
    csrfToken: response.locals.csrfToken,
    levels: LEVELS,
  });
}

router.get('/skilltrack', requireStudentAuth, async (request, response, next) => {
  try {
    return await renderSkillTrack(request, response);
  } catch (error) {
    return next(error);
  }
});

router.post('/skilltrack', requireStudentAuth, async (request, response, next) => {
  const skillId = typeof request.body?.skillId === 'string' ? request.body.skillId : '';
  const currentLevel = typeof request.body?.currentLevel === 'string' ? request.body.currentLevel : '';
  const commitMessage = typeof request.body?.commitMessage === 'string' ? request.body.commitMessage.trim() : '';
  const changeSummary = typeof request.body?.changeSummary === 'string' ? request.body.changeSummary.trim() : '';

  if (!mongoose.isValidObjectId(skillId)
    || !LEVELS.includes(currentLevel)
    || commitMessage.length < 3
    || commitMessage.length > 100
    || changeSummary.length < 3
    || changeSummary.length > 500) {
    try {
      return await renderSkillTrack(request, response, 400, 'Choose a skill and level, and provide a 3-100 character milestone title and 3-500 character summary.');
    } catch (error) {
      return next(error);
    }
  }

  try {
    const skill = await Skill.findById(skillId).select('_id');
    if (!skill) {
      return await renderSkillTrack(request, response, 400, 'Choose a skill from the available list.');
    }
    const latestEntry = await SkillTrackEntry.findOne({
      student: request.student._id,
      skill: skill._id,
    }).sort({ createdAt: -1, _id: -1 }).select('currentLevel').lean();

    await SkillTrackEntry.create({
      student: request.student._id,
      skill: skill._id,
      previousLevel: latestEntry?.currentLevel || 'beginner',
      currentLevel,
      commitMessage,
      changeSummary,
    });
    return response.redirect(303, '/skilltrack?saved=1');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
