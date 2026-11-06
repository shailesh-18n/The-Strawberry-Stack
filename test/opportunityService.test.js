const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  SAMPLE_OPPORTUNITIES,
  matchStudentWithOpportunity,
} = require('../services/opportunityService');

test('opportunity matching calculates match percentage and categorizes verified vs reported skills', () => {
  const pythonSkillId = '654321654321654321654321';
  const problemSolvingId = '654321654321654321654322';
  const gitSkillId = '654321654321654321654323';

  const sampleOpp = {
    title: 'Junior Python Developer Intern',
    company: 'Bengal Infotech Labs',
    requiredSkills: [
      { _id: pythonSkillId, name: 'Python basics' },
      { _id: problemSolvingId, name: 'Problem solving' },
    ],
    preferredSkills: [
      { _id: gitSkillId, name: 'Git' },
    ],
  };

  const student = {
    assessedSkills: [pythonSkillId], // verified Python
    skillInventory: ['Problem solving'], // reported Problem solving
  };

  const result = matchStudentWithOpportunity(student, sampleOpp);

  // 1 verified (1.0) + 1 reported (0.8) out of 2 required = 1.8 / 2 = 0.9 (75% weight => 67.5%)
  // 0 preferred out of 1 = 0%
  // total = 68%
  assert.equal(result.matchPercentage >= 65 && result.matchPercentage <= 70, true);
  assert.equal(result.matchedRequiredSkills.length, 2);
  assert.equal(result.matchedRequiredSkills.find((s) => s.verified).name, 'Python basics');
  assert.equal(result.matchedRequiredSkills.find((s) => !s.verified).name, 'Problem solving');
  assert.equal(result.missingPreferredSkills.length, 1);
  assert.equal(result.missingPreferredSkills[0].name, 'Git');
  assert.ok(result.improvementSuggestions.length > 0);
  assert.match(result.improvementSuggestions[0], /Take the practical assessment for "Problem solving"/);
});

test('opportunity matching identifies strong match when all required skills are verified', () => {
  const pythonSkillId = '654321654321654321654321';
  const problemSolvingId = '654321654321654321654322';

  const sampleOpp = {
    title: 'Python Intern',
    company: 'Test Labs',
    requiredSkills: [
      { _id: pythonSkillId, name: 'Python basics' },
      { _id: problemSolvingId, name: 'Problem solving' },
    ],
    preferredSkills: [],
  };

  const student = {
    assessedSkills: [pythonSkillId, problemSolvingId],
    skillInventory: [],
  };

  const result = matchStudentWithOpportunity(student, sampleOpp);
  assert.equal(result.matchPercentage, 100);
  assert.equal(result.isStrongMatch, true);
  assert.equal(result.missingRequiredSkills.length, 0);
});

test('SAMPLE_OPPORTUNITIES defines at least 4 realistic internship opportunities', () => {
  assert.ok(SAMPLE_OPPORTUNITIES.length >= 4);
  SAMPLE_OPPORTUNITIES.forEach((opp) => {
    assert.ok(opp.title);
    assert.ok(opp.company);
    assert.ok(opp.location);
    assert.ok(opp.requiredSkillSlugs.length > 0);
  });
});

