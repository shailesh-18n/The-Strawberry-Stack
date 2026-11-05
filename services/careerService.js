const { listCareers } = require('../utils/store');

function scoreCareer(user, career) {
  const interestMatches = (user.interests || []).filter((interest) => career.name.toLowerCase().includes(String(interest).toLowerCase()) || (career.skills || []).some((skill) => String(skill).toLowerCase().includes(String(interest).toLowerCase()))).length;
  const skillMatches = (user.skillInventory || []).filter((skill) => (career.skills || []).map((item) => item.toLowerCase()).includes(String(skill).toLowerCase())).length;
  const aspirationBoost = (user.aspirations || []).some((item) => String(item).toLowerCase() === String(career.name).toLowerCase()) ? 2 : 0;
  return interestMatches + skillMatches + aspirationBoost;
}

function getCareerRecommendations(user) {
  const careers = listCareers();
  const scored = careers.map((career) => ({
    career,
    score: scoreCareer(user, career),
  }));

  scored.sort((a, b) => b.score - a.score);

  const top = scored[0] || { career: careers[0], score: 0 };
  const userSkills = (user.skillInventory || []).map((skill) => String(skill).toLowerCase());
  const requiredSkills = (top.career.skills || []).map((skill) => String(skill).toLowerCase());
  const missingSkills = requiredSkills.filter((skill) => !userSkills.includes(skill));

  return {
    career: top.career,
    score: top.score,
    missingSkills,
    roadmap: top.career.roadmap || [],
  };
}

module.exports = {
  getCareerRecommendations,
};
