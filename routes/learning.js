const express = require('express');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const { AiServiceError, buildAssistantReply } = require('../services/aiService');
const { getCareerNavigator } = require('../services/careerService');
const LearningProgress = require('../models/LearningProgress');
const Skill = require('../models/Skill');
const {
  getOfflineLearningPack,
  normalizeCompletedSkills,
} = require('../services/offlineLearningService');

const router = express.Router();
const MAX_QUESTION_LENGTH = 1000;

router.get('/learning/offline-pack', (request, response) => {
  response.set('Cache-Control', 'public, max-age=300');
  return response.json(getOfflineLearningPack());
});

router.get('/learning/progress/state', requireStudentAuth, async (request, response, next) => {
  try {
    const progress = await LearningProgress.find({ student: request.student._id })
      .populate('skill', 'slug')
      .lean();
    response.set('Cache-Control', 'private, no-store');
    return response.json({
      csrfToken: response.locals.csrfToken,
      completedSkills: progress.map((entry) => entry.skill.slug),
      revision: progress.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/learning/progress/sync', requireStudentAuth, async (request, response, next) => {
  const completedSkills = normalizeCompletedSkills(request.body?.completedSkills);
  const baseCompletedSkills = normalizeCompletedSkills(request.body?.baseCompletedSkills);
  if (!completedSkills || !baseCompletedSkills) {
    return response.status(400).json({ error: 'The offline progress list is invalid.' });
  }

  try {
    const allSlugs = [...new Set([...completedSkills, ...baseCompletedSkills])];
    const skills = await Skill.find({ slug: { $in: allSlugs } }).select('_id slug').lean();
    if (skills.length !== allSlugs.length) {
      return response.status(400).json({ error: 'The offline progress includes an unknown lesson.' });
    }

    const currentRecords = await LearningProgress.find({ student: request.student._id })
      .populate('skill', 'slug')
      .lean();
    const currentSlugs = new Set(currentRecords.map((record) => record.skill.slug));
    const conflictSkills = [...currentSlugs].filter((slug) => (
      !baseCompletedSkills.includes(slug) && !completedSkills.includes(slug)
    ));
    const mergedSlugs = [...new Set([...currentSlugs, ...completedSkills])];
    const mergedSkills = skills.filter((skill) => mergedSlugs.includes(skill.slug));
    const newlySynced = completedSkills.filter((slug) => !currentSlugs.has(slug));

    if (mergedSkills.length) {
      try {
        await LearningProgress.bulkWrite(mergedSkills.map((skill) => ({
          updateOne: {
            filter: { student: request.student._id, skill: skill._id },
            update: {
              $setOnInsert: {
                student: request.student._id,
                skill: skill._id,
                completedAt: new Date(),
              },
            },
            upsert: true,
          },
        })));
      } catch (error) {
        if (error.code !== 11000) throw error;
        const persisted = await LearningProgress.countDocuments({
          student: request.student._id,
          skill: { $in: mergedSkills.map((skill) => skill._id) },
        });
        if (persisted !== mergedSkills.length) throw error;
      }
    }

    response.set('Cache-Control', 'private, no-store');
    return response.json({
      synced: newlySynced.length,
      completedSkills: mergedSlugs,
      conflicts: conflictSkills,
      conflictResolution: 'completion-wins',
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/assistant', requireStudentAuth, async (request, response, next) => {
  try {
    const navigator = await getCareerNavigator(request.student);
    return response.render('learning/assistant', {
      title: 'Vernacular Learning Assistant',
      user: request.student,
      question: '',
      answer: null,
      navigator,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/assistant', requireStudentAuth, async (request, response, next) => {
  const question = typeof request.body.question === 'string' ? request.body.question.trim() : '';
  let navigator;
  try {
    navigator = await getCareerNavigator(request.student);
    if (!question || question.length > MAX_QUESTION_LENGTH) {
      return response.status(400).render('learning/assistant', {
        title: 'Vernacular Learning Assistant',
        user: request.student,
        question,
        answer: null,
        navigator,
        error: `Enter a question of 1 to ${MAX_QUESTION_LENGTH} characters.`,
      });
    }

    const answer = await buildAssistantReply(
      request.student,
      question,
      request.student.preferredLanguage,
      navigator,
    );
    return response.render('learning/assistant', {
      title: 'Vernacular Learning Assistant',
      user: request.student,
      question,
      answer,
      navigator,
      error: null,
    });
  } catch (error) {
    if (error instanceof AiServiceError && navigator) {
      return response.status(error.statusCode).render('learning/assistant', {
        title: 'Vernacular Learning Assistant',
        user: request.student,
        question,
        answer: null,
        navigator,
        error: error.message,
      });
    }
    return next(error);
  }
});

module.exports = router;
