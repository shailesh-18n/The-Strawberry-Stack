const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Credential = require('../models/Credential');
const SkillTrackEntry = require('../models/SkillTrackEntry');
const requireStudentAuth = require('../middleware/requireStudentAuth');
const { seedOpportunities } = require('../services/opportunityService');

const router = express.Router();

router.get('/recruiter', async (request, response, next) => {
  try {
    await seedOpportunities();

    const opportunities = await Opportunity.find({ status: 'active' })
      .populate('requiredSkills', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    const skillFilter = typeof request.query?.skillFilter === 'string'
      ? request.query.skillFilter.trim().toLowerCase()
      : '';

    let candidatesQuery = { portfolioPrivacy: 'public' };

    const candidatesDocs = await User.find(candidatesQuery)
      .populate('assessedSkills', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = candidatesDocs.map((c) => c._id);
    const credentials = await Credential.find({ student: { $in: studentIds } }).select('student').lean();
    const credCountByStudent = new Map();
    credentials.forEach((c) => {
      const sid = String(c.student);
      credCountByStudent.set(sid, (credCountByStudent.get(sid) || 0) + 1);
    });

    let candidates = candidatesDocs.map((c) => ({
      ...c,
      credentialsCount: credCountByStudent.get(String(c._id)) || 0,
    }));

    if (skillFilter) {
      candidates = candidates.filter((c) => {
        const hasAssessed = (c.assessedSkills || []).some((s) => s.name.toLowerCase().includes(skillFilter));
        const hasReported = (c.skillInventory || []).some((s) => s.toLowerCase().includes(skillFilter));
        return hasAssessed || hasReported;
      });
    }

    return response.render('recruiter/dashboard', {
      title: 'Recruiter Dashboard',
      user: response.locals.user || null,
      opportunities,
      candidates,
      skillFilter,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/portfolio/:id', async (request, response, next) => {
  const studentId = request.params.id;
  if (!mongoose.isValidObjectId(studentId)) {
    return response.status(404).render('errors/404', {
      title: 'Student not found',
      user: response.locals.user || null,
      csrfToken: response.locals.csrfToken,
      currentYear: new Date().getFullYear(),
    });
  }

  try {
    const student = await User.findById(studentId)
      .populate('assessedSkills', 'name slug')
      .lean();

    if (!student) {
      return response.status(404).render('errors/404', {
        title: 'Student not found',
        user: response.locals.user || null,
        csrfToken: response.locals.csrfToken,
        currentYear: new Date().getFullYear(),
      });
    }

    const currentUserId = String(request.session?.userId || '');
    const isOwner = currentUserId === String(student._id);
    const isRecruiter = request.session?.role === 'recruiter';
    const isPublic = student.portfolioPrivacy === 'public';
    const isAccessible = isPublic || isOwner || isRecruiter;

    let credentials = [];
    let entries = [];

    if (isAccessible) {
      [credentials, entries] = await Promise.all([
        Credential.find({ student: student._id })
          .populate('skill', 'name slug')
          .sort({ createdAt: -1 })
          .lean(),
        SkillTrackEntry.find({ student: student._id })
          .populate('skill', 'name slug')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);
    }

    return response.render('student/portfolio', {
      title: `${student.name} • Skill Portfolio`,
      user: response.locals.user || null,
      student,
      assessedSkills: student.assessedSkills || [],
      credentials,
      entries,
      isOwner,
      isAccessible,
      csrfToken: response.locals.csrfToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/portfolio/privacy', requireStudentAuth, async (request, response, next) => {
  const privacy = request.body?.privacy === 'private' ? 'private' : 'public';
  try {
    request.student.portfolioPrivacy = privacy;
    await request.student.save();
    return response.redirect(303, `/portfolio/${request.student._id}`);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

