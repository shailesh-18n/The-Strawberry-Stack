const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildCareerNavigator } = require('../services/careerService');
const { seedCareerData, seedSkillData } = require('../services/seedService');

function getCareerFixtures() {
  const skills = new Map(seedSkillData().map((definition) => [
    definition.slug,
    { ...definition, _id: definition.slug, prerequisites: [] },
  ]));
  for (const definition of seedSkillData()) {
    skills.get(definition.slug).prerequisites = (definition.prerequisites || [])
      .map((slug) => skills.get(slug));
  }
  const careers = seedCareerData().map((definition) => {
    const graphSkills = new Map();
    const addSkill = (skill) => {
      if (graphSkills.has(skill.slug)) return;
      graphSkills.set(skill.slug, skill);
      skill.prerequisites.forEach(addSkill);
    };
    const requiredSkills = definition.requiredSkills.map((slug) => skills.get(slug));
    requiredSkills.forEach(addSkill);
    return {
      ...definition,
      skills: requiredSkills,
      graphSkills: [...graphSkills.values()],
    };
  });
  return { careers, skills };
}

test('recommendations rank multiple profiles from explicit goals, structured interests, and skill coverage', () => {
  const { careers } = getCareerFixtures();
  const python = buildCareerNavigator({
    aspirations: ['Python Developer'],
    interests: ['automation'],
    skillInventory: ['python'],
  }, careers).recommendation;
  const web = buildCareerNavigator({
    aspirations: ['Web Developer'],
    interests: ['web development'],
    skillInventory: ['HTML', 'CSS', 'JavaScript', 'Responsive design', 'APIs', 'Testing'],
  }, careers).recommendation;
  const data = buildCareerNavigator({
    aspirations: ['Data Analyst'],
    interests: ['analytics'],
    skillInventory: ['Statistics', 'Excel', 'SQL', 'Visualization', 'Communication'],
  }, careers).recommendation;

  assert.equal(python.career.slug, 'python-developer');
  assert.equal(web.career.slug, 'web-developer');
  assert.equal(web.completionPercent, 100);
  assert.equal(data.career.slug, 'data-analyst');
  assert.equal(data.completionPercent, 100);
});

test('selected career focus and case-insensitive manual skill matching work', () => {
  const { careers } = getCareerFixtures();
  const { tracks, recommendation } = buildCareerNavigator({
    aspirations: ['Web Developer'],
    interests: ['JavaScript'],
    skillInventory: ['html', 'CSS'],
  }, careers, 'data-analyst');

  assert.equal(recommendation.career.slug, 'data-analyst');
  assert.equal(recommendation.selected, true);
  const web = tracks.find((track) => track.career.slug === 'web-developer');
  assert.equal(web.isAspiration, true);
  assert.deepEqual(web.matchingSkills, ['HTML', 'CSS']);
});

test('personalized roadmap schedules missing prerequisites before dependent career skills', () => {
  const { careers } = getCareerFixtures();
  const { recommendation } = buildCareerNavigator({
    aspirations: ['Python Developer'],
    skillInventory: [],
  }, careers);
  const steps = recommendation.roadmap.map((step) => step.slug);

  assert.ok(steps.indexOf('functions') < steps.indexOf('data-structures'));
  assert.ok(steps.indexOf('data-structures') < steps.indexOf('apis'));
  assert.ok(steps.indexOf('problem-solving') < steps.indexOf('logical-thinking'));
  assert.ok(steps.indexOf('logical-thinking') < steps.indexOf('python-basics'));
});

test('assessed skill references count as verified existing skills', () => {
  const { careers, skills } = getCareerFixtures();
  const { recommendation } = buildCareerNavigator({
    aspirations: ['Python Developer'],
    skillInventory: [],
    assessedSkills: [skills.get('python-basics')._id],
  }, careers);

  assert.ok(recommendation.matchingSkills.includes('Python basics'));
  assert.ok(!recommendation.roadmap.some((step) => step.slug === 'python-basics'));
});

test('skill graph includes prerequisite links and unknown career selection is ignored', () => {
  const { careers } = getCareerFixtures();
  const { tracks, recommendation, graph } = buildCareerNavigator({}, careers, 'not-a-career');
  const pythonGraph = graph.tracks.find((track) => track.career.slug === 'python-developer');

  assert.equal(recommendation.career.slug, 'data-analyst');
  assert.equal(tracks.some((track) => track.selected), false);
  assert.ok(pythonGraph.skillNodes.some((skill) => !skill.required && skill.name === 'Problem solving'));
  assert.ok(pythonGraph.prerequisiteEdges.length > 0);
});
