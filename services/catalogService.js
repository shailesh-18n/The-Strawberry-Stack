const Career = require('../models/Career');
const Skill = require('../models/Skill');
const { seedCareerData, seedSkillData } = require('./seedService');

async function seedCatalog() {
  const skillDefinitions = seedSkillData();
  const skills = new Map();

  for (const definition of skillDefinitions) {
    const skill = await Skill.findOneAndUpdate(
      { slug: definition.slug },
      {
        $set: {
          name: definition.name,
          description: definition.description || '',
          category: definition.category,
          level: definition.level,
          aliases: definition.aliases || [],
          learningActivity: definition.learningActivity,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    );
    skills.set(skill.slug, skill);
  }

  for (const definition of skillDefinitions) {
    const skill = skills.get(definition.slug);
    skill.prerequisites = (definition.prerequisites || []).map((slug) => {
      const prerequisite = skills.get(slug);
      if (!prerequisite) {
        throw new Error(`Unknown prerequisite "${slug}" for skill "${definition.slug}".`);
      }
      return prerequisite._id;
    });
    await skill.save();
  }

  for (const definition of seedCareerData()) {
    const requiredSkills = definition.requiredSkills.map((slug, sequence) => {
      const skill = skills.get(slug);
      if (!skill) {
        throw new Error(`Unknown required skill "${slug}" for career "${definition.slug}".`);
      }
      return { skill: skill._id, sequence };
    });
    await Career.findOneAndUpdate(
      { slug: definition.slug },
      {
        $set: {
          name: definition.name,
          description: definition.description,
          level: definition.level,
          interestTags: definition.interestTags,
          requiredSkills,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    );
  }

  return { skills: skills.size, careers: seedCareerData().length };
}

module.exports = { seedCatalog };
