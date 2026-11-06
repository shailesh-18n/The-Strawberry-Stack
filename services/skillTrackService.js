const crypto = require('node:crypto');
const SkillTrackEntry = require('../models/SkillTrackEntry');
const StudentAssessment = require('../models/StudentAssessment');
const Skill = require('../models/Skill');
const User = require('../models/User');

const LEVEL_RANKS = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function generateCommitHash(content = '') {
  return crypto.createHash('sha256')
    .update(`${content}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`)
    .digest('hex')
    .slice(0, 8);
}

function normalizeBranchName(branch, defaultBranch = 'main') {
  if (!branch || typeof branch !== 'string') return defaultBranch;
  const normalized = branch
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || defaultBranch;
}

function compareSkillProgress({ previousLevel, currentLevel, previousScore, currentScore, isAssessment = false }) {
  if (isAssessment) {
    if (previousScore == null || previousScore === undefined) {
      return {
        status: 'initial',
        scoreDelta: null,
        diff: `Initial assessment: ${currentScore}% score`,
      };
    }
    const scoreDelta = currentScore - previousScore;
    if (scoreDelta > 0) {
      return {
        status: 'improved',
        scoreDelta,
        diff: `+${scoreDelta}% score improvement (${previousScore}% → ${currentScore}%)`,
      };
    }
    if (scoreDelta < 0) {
      return {
        status: 'regressed',
        scoreDelta,
        diff: `${scoreDelta}% score regression (${previousScore}% → ${currentScore}%)`,
      };
    }
    return {
      status: 'unchanged',
      scoreDelta: 0,
      diff: `Score unchanged at ${currentScore}%`,
    };
  }

  const prevRank = LEVEL_RANKS[previousLevel] ?? 0;
  const currRank = LEVEL_RANKS[currentLevel] ?? 0;

  if (previousLevel === undefined || previousLevel === null) {
    return {
      status: 'initial',
      scoreDelta: null,
      diff: `Started learning at ${currentLevel} level`,
    };
  }

  if (currRank > prevRank) {
    return {
      status: 'improved',
      scoreDelta: null,
      diff: `Level advanced: ${previousLevel} → ${currentLevel}`,
    };
  }
  if (currRank < prevRank) {
    return {
      status: 'regressed',
      scoreDelta: null,
      diff: `Skill regression recorded: ${previousLevel} → ${currentLevel}`,
    };
  }
  return {
    status: 'unchanged',
    scoreDelta: null,
    diff: `Maintained ${currentLevel} level`,
  };
}

async function recordAssessmentCommit({
  student,
  skill,
  assessment,
  challengeTitle,
  result,
  branch: preferredBranch,
}) {
  const studentId = student._id || student;
  const skillId = skill._id || skill;
  const assessmentId = assessment._id || assessment;

  // Idempotency check: if a commit already exists for this assessment attempt, return it
  const existingCommit = await SkillTrackEntry.findOne({
    student: studentId,
    assessment: assessmentId,
  });
  if (existingCommit) {
    return existingCommit;
  }

  // Find latest entry for this student and skill (chronological history)
  const latestEntry = await SkillTrackEntry.findOne({
    student: studentId,
    skill: skillId,
  }).sort({ createdAt: -1, _id: -1 }).lean();

  const previousLevel = latestEntry?.currentLevel || 'beginner';
  const passed = Boolean(result.passed || result.success);

  let currentLevel = previousLevel;
  if (passed) {
    if (previousLevel === 'beginner') currentLevel = 'intermediate';
    else if (previousLevel === 'intermediate') currentLevel = 'advanced';
    else currentLevel = 'advanced';
  }

  const total = result.totalTests || (result.questions ? result.questions.length : 1);
  const passedCount = result.passedTests || 0;
  const currentScore = typeof result.score === 'number'
    ? result.score
    : Math.round((passedCount / Math.max(total, 1)) * 100);

  const previousScore = (latestEntry?.score != null) ? latestEntry.score : null;

  const comparison = compareSkillProgress({
    previousLevel,
    currentLevel,
    previousScore,
    currentScore,
    isAssessment: true,
  });

  // Determine branch: student's preference, or primary career aspiration, or 'main'
  let branch = preferredBranch;
  if (!branch) {
    const studentUser = student.aspirations ? student : await User.findById(studentId).select('aspirations').lean();
    if (studentUser?.aspirations?.[0]) {
      branch = studentUser.aspirations[0];
    }
  }
  branch = normalizeBranchName(branch, 'main');

  const title = challengeTitle || assessment.challengeId || 'assessment';
  const commitMessage = passed
    ? `Passed ${title}: ${currentScore}% score`
    : `Attempted ${title}: ${passedCount}/${total} tests (${currentScore}%)`;

  const changeSummary = result.message || (passed
    ? `Successfully passed all requirements for ${title}.`
    : `${passedCount} of ${total} tests passed. Further practice recommended.`);

  const tag = passed ? `v1.0-${assessment.challengeId || 'assessment'}-verified` : null;
  const commitHash = generateCommitHash(`${studentId}:${skillId}:${assessmentId}`);

  // Create immutable learning commit (historical achievements are never silently overwritten)
  return await SkillTrackEntry.create({
    student: studentId,
    skill: skillId,
    assessment: assessmentId,
    entryType: 'assessment',
    previousLevel,
    currentLevel,
    previousScore,
    score: currentScore,
    scoreDelta: comparison.scoreDelta,
    diff: comparison.diff,
    status: comparison.status,
    commitMessage,
    changeSummary: changeSummary.slice(0, 500),
    branch,
    tag,
    isVerified: passed,
    commitHash,
  });
}

async function recordMilestoneCommit({
  student,
  skillId,
  currentLevel,
  commitMessage,
  changeSummary,
  branch,
  tag,
}) {
  const studentId = student._id || student;

  const skill = await Skill.findById(skillId).select('_id name');
  if (!skill) {
    throw new Error('Choose a skill from the available list.');
  }

  const latestEntry = await SkillTrackEntry.findOne({
    student: studentId,
    skill: skill._id,
  }).sort({ createdAt: -1, _id: -1 }).lean();

  const previousLevel = latestEntry?.currentLevel || 'beginner';
  const comparison = compareSkillProgress({
    previousLevel,
    currentLevel,
    previousScore: null,
    currentScore: null,
    isAssessment: false,
  });

  const branchName = normalizeBranchName(branch, 'main');
  const cleanTag = tag && typeof tag === 'string' && tag.trim().length > 0
    ? tag.trim().slice(0, 50)
    : null;

  const commitHash = generateCommitHash(`${studentId}:${skill._id}:${commitMessage}`);

  // Create immutable milestone commit
  return await SkillTrackEntry.create({
    student: studentId,
    skill: skill._id,
    entryType: 'milestone',
    previousLevel,
    currentLevel,
    commitMessage: commitMessage.trim(),
    changeSummary: changeSummary.trim(),
    branch: branchName,
    tag: cleanTag,
    isVerified: false,
    diff: comparison.diff,
    status: comparison.status,
    commitHash,
  });
}

async function syncActualAssessmentsToCommits(studentId) {
  // Find all student assessments
  const assessments = await StudentAssessment.find({ student: studentId })
    .populate('skill', 'name slug')
    .sort({ createdAt: 1 })
    .lean();

  if (!assessments.length) return [];

  const existingCommitAssessmentIds = new Set(
    (await SkillTrackEntry.find({ student: studentId, assessment: { $ne: null } })
      .select('assessment')
      .lean())
      .map((entry) => String(entry.assessment))
  );

  const created = [];
  for (const assessment of assessments) {
    if (!existingCommitAssessmentIds.has(String(assessment._id))) {
      const commit = await recordAssessmentCommit({
        student: studentId,
        skill: assessment.skill,
        assessment,
        challengeTitle: assessment.challengeId,
        result: {
          passed: assessment.passed,
          passedTests: assessment.passedTests,
          totalTests: assessment.totalTests,
          score: assessment.score,
          verdict: assessment.verdict,
        },
      });
      created.push(commit);
      existingCommitAssessmentIds.add(String(assessment._id));
    }
  }
  return created;
}

module.exports = {
  compareSkillProgress,
  generateCommitHash,
  normalizeBranchName,
  recordAssessmentCommit,
  recordMilestoneCommit,
  syncActualAssessmentsToCommits,
};

