const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  compareSkillProgress,
  generateCommitHash,
  normalizeBranchName,
} = require('../services/skillTrackService');

test('skill progress comparison detects initial state', () => {
  const result = compareSkillProgress({
    previousLevel: null,
    currentLevel: 'beginner',
    previousScore: null,
    currentScore: 50,
    isAssessment: true,
  });
  assert.equal(result.status, 'initial');
  assert.match(result.diff, /Initial assessment: 50% score/);
});

test('skill progress comparison detects improvement in assessment scores', () => {
  const result = compareSkillProgress({
    previousLevel: 'beginner',
    currentLevel: 'intermediate',
    previousScore: 50,
    currentScore: 100,
    isAssessment: true,
  });
  assert.equal(result.status, 'improved');
  assert.equal(result.scoreDelta, 50);
  assert.match(result.diff, /\+50% score improvement/);
});

test('skill progress comparison detects regression in assessment scores', () => {
  const result = compareSkillProgress({
    previousLevel: 'intermediate',
    currentLevel: 'intermediate',
    previousScore: 100,
    currentScore: 75,
    isAssessment: true,
  });
  assert.equal(result.status, 'regressed');
  assert.equal(result.scoreDelta, -25);
  assert.match(result.diff, /-25% score regression/);
});

test('skill progress comparison detects unchanged assessment scores', () => {
  const result = compareSkillProgress({
    previousLevel: 'intermediate',
    currentLevel: 'intermediate',
    previousScore: 80,
    currentScore: 80,
    isAssessment: true,
  });
  assert.equal(result.status, 'unchanged');
  assert.equal(result.scoreDelta, 0);
  assert.match(result.diff, /Score unchanged/);
});

test('skill progress comparison detects milestone level advancement and regression', () => {
  const improved = compareSkillProgress({
    previousLevel: 'beginner',
    currentLevel: 'intermediate',
    isAssessment: false,
  });
  assert.equal(improved.status, 'improved');
  assert.match(improved.diff, /Level advanced: beginner → intermediate/);

  const regressed = compareSkillProgress({
    previousLevel: 'advanced',
    currentLevel: 'beginner',
    isAssessment: false,
  });
  assert.equal(regressed.status, 'regressed');
  assert.match(regressed.diff, /Skill regression recorded: advanced → beginner/);

  const unchanged = compareSkillProgress({
    previousLevel: 'intermediate',
    currentLevel: 'intermediate',
    isAssessment: false,
  });
  assert.equal(unchanged.status, 'unchanged');
  assert.match(unchanged.diff, /Maintained intermediate level/);
});

test('branch names are normalized safely to valid git-like branch names', () => {
  assert.equal(normalizeBranchName('Python Developer'), 'python-developer');
  assert.equal(normalizeBranchName('Front-end & Web!'), 'front-end-web');
  assert.equal(normalizeBranchName(''), 'main');
  assert.equal(normalizeBranchName(null), 'main');
});

test('commit hashes are 8-character hex strings', () => {
  const hash1 = generateCommitHash('test-content-1');
  const hash2 = generateCommitHash('test-content-2');
  assert.match(hash1, /^[0-9a-f]{8}$/);
  assert.match(hash2, /^[0-9a-f]{8}$/);
  assert.notEqual(hash1, hash2);
});

