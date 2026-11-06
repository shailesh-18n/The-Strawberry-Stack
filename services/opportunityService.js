const mongoose = require('mongoose');
const Opportunity = require('../models/Opportunity');
const Skill = require('../models/Skill');

const SAMPLE_OPPORTUNITIES = [
  {
    title: 'Junior Python Developer Intern',
    company: 'Bengal Infotech Labs',
    location: 'Kolkata, WB (Hybrid)',
    type: 'Internship',
    stipend: '₹18,000 / month',
    description: 'Join our backend engineering team building Python microservices and data processing pipelines. Ideal for students with strong Python basics and problem-solving skills.',
    requiredSkillSlugs: ['python-basics', 'problem-solving', 'testing'],
    preferredSkillSlugs: ['apis', 'sql'],
  },
  {
    title: 'Frontend Web Development Intern',
    company: 'Kolkata Cloud Studio',
    location: 'Kolkata, WB (On-site)',
    type: 'Internship',
    stipend: '₹15,000 / month',
    description: 'Build responsive web interfaces using modern HTML, CSS, and JavaScript. Collaborate with UI designers to deliver accessible user experiences for education and e-commerce platforms.',
    requiredSkillSlugs: ['html', 'css', 'javascript'],
    preferredSkillSlugs: ['responsive-design', 'design-awareness'],
  },
  {
    title: 'Data Analytics & Python Intern',
    company: 'EastData Analytics',
    location: 'Remote (India)',
    type: 'Internship',
    stipend: '₹20,000 / month',
    description: 'Analyze real-world datasets, generate business insights, and automate report generation using Python and SQL. Mentorship provided by senior analytics leads.',
    requiredSkillSlugs: ['python-basics', 'problem-solving'],
    preferredSkillSlugs: ['sql', 'communication'],
  },
  {
    title: 'Full-Stack Software Apprentice',
    company: 'Ganges Software Labs',
    location: 'Howrah, WB (Hybrid)',
    type: 'Apprenticeship',
    stipend: '₹16,000 / month',
    description: 'Work across frontend templates and backend APIs. You will practice full-stack development, test-driven workflows, and version-controlled team collaboration.',
    requiredSkillSlugs: ['html', 'javascript', 'python-basics'],
    preferredSkillSlugs: ['css', 'apis', 'problem-solving'],
  },
];

async function seedOpportunities() {
  const existingCount = await Opportunity.countDocuments();
  if (existingCount > 0) return;

  const allSkills = await Skill.find().select('_id slug name aliases').lean();
  const skillBySlug = new Map();
  allSkills.forEach((s) => {
    skillBySlug.set(s.slug, s._id);
    (s.aliases || []).forEach((alias) => skillBySlug.set(alias, s._id));
  });

  for (const item of SAMPLE_OPPORTUNITIES) {
    const requiredSkills = item.requiredSkillSlugs
      .map((slug) => skillBySlug.get(slug))
      .filter(Boolean);
    const preferredSkills = item.preferredSkillSlugs
      .map((slug) => skillBySlug.get(slug))
      .filter(Boolean);

    await Opportunity.create({
      title: item.title,
      company: item.company,
      location: item.location,
      type: item.type,
      stipend: item.stipend,
      description: item.description,
      requiredSkills,
      preferredSkills,
      status: 'active',
    });
  }
}

function matchStudentWithOpportunity(student, opportunity) {
  const assessedSkillSet = new Set(
    (student?.assessedSkills || []).map((id) => String(id?._id || id))
  );

  const reportedSkillNames = new Set(
    (student?.skillInventory || []).map((s) => s.toLowerCase().trim())
  );

  const reqSkills = opportunity.requiredSkills || [];
  const prefSkills = opportunity.preferredSkills || [];

  const matchedRequired = [];
  const missingRequired = [];
  let reqEarned = 0;

  reqSkills.forEach((skill) => {
    const skillId = String(skill._id || skill);
    const skillName = skill.name || 'Skill';
    const hasAssessed = assessedSkillSet.has(skillId);
    const hasReported = reportedSkillNames.has(skillName.toLowerCase().trim());

    if (hasAssessed) {
      reqEarned += 1.0;
      matchedRequired.push({ skill, name: skillName, verified: true });
    } else if (hasReported) {
      reqEarned += 0.8;
      matchedRequired.push({ skill, name: skillName, verified: false });
    } else {
      missingRequired.push({ skill, name: skillName });
    }
  });

  const matchedPreferred = [];
  const missingPreferred = [];
  let prefEarned = 0;

  prefSkills.forEach((skill) => {
    const skillId = String(skill._id || skill);
    const skillName = skill.name || 'Skill';
    const hasAssessed = assessedSkillSet.has(skillId);
    const hasReported = reportedSkillNames.has(skillName.toLowerCase().trim());

    if (hasAssessed) {
      prefEarned += 1.0;
      matchedPreferred.push({ skill, name: skillName, verified: true });
    } else if (hasReported) {
      prefEarned += 0.8;
      matchedPreferred.push({ skill, name: skillName, verified: false });
    } else {
      missingPreferred.push({ skill, name: skillName });
    }
  });

  const reqTotal = reqSkills.length || 1;
  const prefTotal = prefSkills.length || 0;

  let matchPercentage;
  if (prefTotal > 0) {
    const reqRatio = reqEarned / reqTotal;
    const prefRatio = prefEarned / prefTotal;
    matchPercentage = Math.round((reqRatio * 0.75 + prefRatio * 0.25) * 100);
  } else {
    matchPercentage = Math.round((reqEarned / reqTotal) * 100);
  }

  matchPercentage = Math.min(Math.max(matchPercentage, 0), 100);

  const improvementSuggestions = [];

  missingRequired.forEach((item) => {
    improvementSuggestions.push(
      `Complete assessment for "${item.name}" to satisfy a required skill for ${opportunity.company}.`
    );
  });

  matchedRequired
    .filter((item) => !item.verified)
    .forEach((item) => {
      improvementSuggestions.push(
        `Take the practical assessment for "${item.name}" to verify your self-reported skill and earn a credential.`
      );
    });

  missingPreferred.slice(0, 2).forEach((item) => {
    improvementSuggestions.push(
      `Add "${item.name}" to your roadmap in Career Navigator to stand out as a preferred candidate.`
    );
  });

  return {
    opportunity,
    matchPercentage,
    matchedRequiredSkills: matchedRequired,
    missingRequiredSkills: missingRequired,
    matchedPreferredSkills: matchedPreferred,
    missingPreferredSkills: missingPreferred,
    improvementSuggestions,
    isStrongMatch: matchPercentage >= 75,
  };
}

async function matchStudentWithAllOpportunities(student) {
  await seedOpportunities();

  const opportunities = await Opportunity.find({ status: 'active' })
    .populate('requiredSkills', 'name slug')
    .populate('preferredSkills', 'name slug')
    .lean();

  const matched = opportunities.map((opp) => matchStudentWithOpportunity(student, opp));
  matched.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return matched;
}

module.exports = {
  SAMPLE_OPPORTUNITIES,
  matchStudentWithAllOpportunities,
  matchStudentWithOpportunity,
  seedOpportunities,
};
