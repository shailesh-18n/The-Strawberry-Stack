const express = require('express');
const mongoose = require('mongoose');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const LearningProgress = require('../models/LearningProgress');
const Skill = require('../models/Skill');
const SkillTrackEntry = require('../models/SkillTrackEntry');
const SkillTrackProgress = require('../models/SkillTrackProgress');
const {
  normalizeBranchName,
  recordMilestoneCommit,
  syncActualAssessmentsToCommits,
} = require('../services/skillTrackService');

const router = express.Router();
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const MAX_ENTRIES = 50;

async function loadSkillTrack(student, selectedBranch = null) {
  const studentId = student._id;

  // Integrate any actual assessment records into the git-inspired commit history
  await syncActualAssessmentsToCommits(studentId).catch(() => []);

  const query = { student: studentId };
  const cleanBranch = selectedBranch && selectedBranch !== 'all'
    ? normalizeBranchName(selectedBranch)
    : null;
  if (cleanBranch) {
    query.branch = cleanBranch;
  }

  const [skills, entries, assessmentProgress, lessonProgress, dbBranches] = await Promise.all([
    Skill.find().select('name slug').sort({ name: 1 }).lean(),
    SkillTrackEntry.find(query)
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
    SkillTrackEntry.distinct('branch', { student: studentId }),
  ]);

  const branchesSet = new Set(['main']);
  if (Array.isArray(student.aspirations)) {
    student.aspirations.forEach((aspiration) => {
      branchesSet.add(normalizeBranchName(aspiration));
    });
  }
  dbBranches.forEach((branch) => {
    if (branch) branchesSet.add(normalizeBranchName(branch));
  });

  return {
    skills,
    entries,
    assessmentProgress,
    lessonProgress,
    branches: Array.from(branchesSet),
    selectedBranch: cleanBranch || 'all',
  };
}

async function renderSkillTrack(request, response, status = 200, error = null) {
  const selectedBranch = typeof request.query?.branch === 'string' ? request.query.branch : 'all';
  const data = await loadSkillTrack(request.student, selectedBranch);
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
  const branch = typeof request.body?.branch === 'string' ? request.body.branch.trim() : 'main';
  const tag = typeof request.body?.tag === 'string' ? request.body.tag.trim() : null;

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
    await recordMilestoneCommit({
      student: request.student,
      skillId,
      currentLevel,
      commitMessage,
      changeSummary,
      branch: branch || 'main',
      tag: tag || null,
    });
    return response.redirect(303, '/skilltrack?saved=1');
  } catch (error) {
    if (error.message === 'Choose a skill from the available list.') {
      return await renderSkillTrack(request, response, 400, error.message);
    }
    return next(error);
  }
});

module.exports = router;
