const { seedCareerData } = require('../services/seedService');

const LANGUAGES = ['Bengali', 'English'];
const CAREER_OPTIONS = seedCareerData().map((career) => career.name);

function readString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readList(value, { commaSeparated = false } = {}) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values
    .flatMap((item) => (commaSeparated && typeof item === 'string' ? item.split(',') : [item]))
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    )];
}

function buildStudentProfile(body = {}) {
  return {
    name: readString(body.name),
    preferredLanguage: readString(body.preferredLanguage),
    interests: readList(body.interests, { commaSeparated: true }),
    aspirations: readList(body.aspirations),
    skillInventory: readList(body.skillInventory, { commaSeparated: true }),
    educationLevel: readString(body.educationLevel),
    learningPreferences: readList(body.learningPreferences, { commaSeparated: true }),
    accessNeeds: readList(body.accessNeeds, { commaSeparated: true }),
    profileSummary: readString(body.profileSummary),
  };
}

function validateStudentProfile(profile) {
  if (profile.name.length < 2 || profile.name.length > 80) {
    return 'Enter a name between 2 and 80 characters.';
  }
  if (!LANGUAGES.includes(profile.preferredLanguage)) {
    return 'Choose a supported preferred language.';
  }
  if (profile.aspirations.some((career) => !CAREER_OPTIONS.includes(career))) {
    return 'Choose career interests from the available options.';
  }
  for (const field of ['interests', 'aspirations', 'skillInventory', 'learningPreferences', 'accessNeeds']) {
    if (profile[field].length > 10 || profile[field].some((item) => item.length > 80)) {
      return 'Each list can contain at most 10 items of 80 characters or fewer.';
    }
  }
  if (profile.educationLevel.length > 80) {
    return 'Education level must be 80 characters or fewer.';
  }
  if (profile.profileSummary.length > 1000) {
    return 'Profile summary must be 1,000 characters or fewer.';
  }
  return null;
}

function normalizeEmail(value) {
  return readString(value).toLowerCase();
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  CAREER_OPTIONS,
  LANGUAGES,
  buildStudentProfile,
  isValidEmail,
  normalizeEmail,
  validateStudentProfile,
};
