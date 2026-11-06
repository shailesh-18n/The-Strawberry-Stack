const Career = require('../models/Career');
const Skill = require('../models/Skill');

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function skillKeys(skill) {
  return [skill.name, skill.slug, ...(skill.aliases || [])].map(normalize);
}

function getKnownSkills(user, allCareerSkills) {
  const knownNames = new Set((user.skillInventory || []).map(normalize));
  const assessedIds = new Set((user.assessedSkills || []).map((skill) => (
    String(skill._id || skill)
  )));
  const knownSlugs = new Set();
  for (const skill of allCareerSkills) {
    if (assessedIds.has(String(skill._id)) || skillKeys(skill).some((key) => knownNames.has(key))) {
      knownSlugs.add(skill.slug);
    }
  }
  return { knownNames, knownSlugs };
}

function buildPersonalizedRoadmap(careerSkills, knownSlugs, knownNames) {
  const requiredSlugs = new Set(careerSkills.map((skill) => skill.slug));
  const candidates = new Map();
  const addMissingSkill = (skill) => {
    const alreadyKnown = knownSlugs.has(skill.slug)
      || skillKeys(skill).some((key) => knownNames.has(key));
    if (alreadyKnown || candidates.has(skill.slug)) return;
    candidates.set(skill.slug, skill);
    for (const prerequisite of skill.prerequisites || []) {
      addMissingSkill(prerequisite);
    }
  };
  careerSkills.forEach(addMissingSkill);

  const roadmap = [];
  const completed = new Set(knownSlugs);
  while (candidates.size) {
    const next = [...candidates.values()]
      .filter((skill) => (skill.prerequisites || []).every((prerequisite) => (
        completed.has(prerequisite.slug)
        || knownNames.has(normalize(prerequisite.name))
        || skillKeys(prerequisite).some((key) => knownNames.has(key))
      )))
      .sort((left, right) => left.name.localeCompare(right.name))[0];

    if (!next) {
      throw new Error('Skill prerequisite graph contains a cycle or unresolved dependency.');
    }
    candidates.delete(next.slug);
    completed.add(next.slug);
    roadmap.push({
      slug: next.slug,
      skill: next.name,
      activity: next.learningActivity,
      prerequisites: (next.prerequisites || []).map((prerequisite) => prerequisite.name),
      requiredForCareer: requiredSlugs.has(next.slug),
    });
  }
  return roadmap;
}

function buildCareerTrack(user, career, selectedSlug, knownSkills) {
  const matchingSkills = career.skills.filter((skill) => (
    knownSkills.knownSlugs.has(skill.slug)
    || skillKeys(skill).some((key) => knownSkills.knownNames.has(key))
  ));
  const missingSkills = career.skills.filter((skill) => !matchingSkills.includes(skill));
  const interestMatches = (user.interests || []).filter((interest) => (
    career.interestTags.includes(normalize(interest))
  ));
  const isAspiration = (user.aspirations || [])
    .some((aspiration) => normalize(aspiration) === normalize(career.name));
  const skillCoverage = career.skills.length
    ? matchingSkills.length / career.skills.length
    : 0;
  const score = (isAspiration ? 100 : 0)
    + Math.round(skillCoverage * 50)
    + Math.min(interestMatches.length, 3) * 10;

  return {
    career: { ...career, skills: career.skills.map((skill) => skill.name) },
    score,
    matchingSkills: matchingSkills.map((skill) => skill.name),
    missingSkills: missingSkills.map((skill) => skill.name),
    interestMatches,
    isAspiration,
    completionPercent: Math.round(skillCoverage * 100),
    selected: career.slug === selectedSlug,
    roadmap: buildPersonalizedRoadmap(career.skills, knownSkills.knownSlugs, knownSkills.knownNames),
    graphSkills: career.graphSkills,
  };
}

function buildSkillGraph(tracks) {
  let cursor = 34;
  const graphTracks = tracks.map((track) => {
    const skillNodes = track.graphSkills.map((skill, index) => ({
      name: skill.name,
      slug: skill.slug,
      learned: track.knownSlugs.has(skill.slug)
        || skillKeys(skill).some((key) => track.knownNames.has(key)),
      required: track.career.skills.includes(skill.name),
      y: cursor + 38 + index * 36,
    }));
    const positions = new Map(skillNodes.map((node) => [node.slug, node.y]));
    const prerequisiteEdges = track.graphSkills.flatMap((skill) => (
      (skill.prerequisites || [])
        .filter((prerequisite) => positions.has(prerequisite.slug))
        .map((prerequisite) => ({
          fromY: positions.get(prerequisite.slug),
          toY: positions.get(skill.slug),
        }))
    ));
    const requiredNodes = skillNodes.filter((node) => node.required);
    const careerNodeY = requiredNodes.length
      ? requiredNodes.reduce((sum, node) => sum + node.y, 0) / requiredNodes.length
      : cursor + 38;
    const graphTrack = { ...track, careerNodeY, skillNodes, prerequisiteEdges };
    cursor += Math.max(skillNodes.length * 36, 90) + 60;
    return graphTrack;
  });

  return {
    width: 820,
    height: Math.max(cursor, 180),
    tracks: graphTracks,
  };
}

function buildCareerNavigator(user, careerDefinitions, selectedSlug) {
  const allSkills = careerDefinitions.flatMap((career) => career.graphSkills);
  const knownSkills = getKnownSkills(user, allSkills);
  const knownCareerSlug = careerDefinitions.some((career) => career.slug === selectedSlug);
  const effectiveSlug = knownCareerSlug ? selectedSlug : null;
  const tracks = careerDefinitions
    .map((career) => ({
      ...buildCareerTrack(user, career, effectiveSlug, knownSkills),
      knownSlugs: knownSkills.knownSlugs,
      knownNames: knownSkills.knownNames,
    }))
    .sort((left, right) => (
      Number(right.selected) - Number(left.selected)
      || right.score - left.score
      || right.completionPercent - left.completionPercent
      || left.career.name.localeCompare(right.career.name)
    ));
  const recommendation = tracks[0] || null;

  return {
    tracks,
    recommendation,
    graph: buildSkillGraph(tracks),
  };
}

async function getCareerNavigator(user, selectedSlug) {
  const [careers, skillRecords] = await Promise.all([
    Career.find({}).sort({ name: 1 }).populate('requiredSkills.skill').lean(),
    Skill.find({}).populate('prerequisites').lean(),
  ]);
  const skillsById = new Map(skillRecords.map((skill) => [String(skill._id), skill]));
  const resolvePrerequisites = (skill, visited = new Set()) => {
    if (visited.has(skill.slug)) {
      throw new Error(`Skill prerequisite cycle detected at "${skill.slug}".`);
    }
    const nextVisited = new Set(visited).add(skill.slug);
    const prerequisites = (skill.prerequisites || []).map((prerequisite) => {
      const resolved = skillsById.get(String(prerequisite._id || prerequisite));
      if (!resolved) {
        throw new Error(`Skill "${skill.slug}" references a missing prerequisite.`);
      }
      return resolvePrerequisites(resolved, nextVisited);
    });
    return {
      ...skill,
      prerequisites,
    };
  };
  const careerDefinitions = careers.map((career) => {
    if (career.requiredSkills.some((mapping) => !mapping.skill)) {
      throw new Error(`Career "${career.slug}" references a missing required skill.`);
    }
    const skills = career.requiredSkills
      .sort((left, right) => left.sequence - right.sequence)
      .map((mapping) => resolvePrerequisites(mapping.skill));
    const graphSkills = new Map();
    const addSkillAndPrerequisites = (skill) => {
      if (graphSkills.has(skill.slug)) return;
      graphSkills.set(skill.slug, skill);
      (skill.prerequisites || []).forEach(addSkillAndPrerequisites);
    };
    skills.forEach(addSkillAndPrerequisites);
    return {
      ...career,
      skills,
      graphSkills: [...graphSkills.values()],
      interestTags: (career.interestTags || []).map(normalize),
    };
  });
  const navigator = buildCareerNavigator(user, careerDefinitions, selectedSlug);
  return navigator;
}

async function getCareerRecommendations(user) {
  const { recommendation } = await getCareerNavigator(user);
  if (!recommendation) {
    return { career: null, score: 0, missingSkills: [], roadmap: [] };
  }
  return {
    career: recommendation.career,
    score: recommendation.score,
    missingSkills: recommendation.missingSkills,
    roadmap: recommendation.roadmap,
  };
}

module.exports = {
  buildCareerNavigator,
  buildPersonalizedRoadmap,
  getCareerNavigator,
  getCareerRecommendations,
};
