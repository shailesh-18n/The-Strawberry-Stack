const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStudentProfile,
  validateStudentProfile,
} = require('../utils/studentProfile');

function validProfile(overrides = {}) {
  return buildStudentProfile({
    name: 'Student Example',
    preferredLanguage: 'English',
    aspirations: 'Python Developer',
    ...overrides,
  });
}

test('profile validation rejects unsupported language and career choices', () => {
  assert.equal(
    validateStudentProfile(validProfile({ preferredLanguage: 'Hindi' })),
    null,
  );
  assert.equal(
    validateStudentProfile(validProfile({ preferredLanguage: 'Kannada' })),
    null,
  );
  assert.match(
    validateStudentProfile(validProfile({ preferredLanguage: 'French' })),
    /supported preferred language/,
  );
  assert.match(
    validateStudentProfile(validProfile({ aspirations: 'Unknown Career' })),
    /available options/,
  );
});

test('profile validation rejects over-limit lists and values without truncating them', () => {
  const skills = Array.from({ length: 11 }, (_, index) => `Skill ${index + 1}`);
  const profile = validProfile({ skillInventory: skills });

  assert.equal(profile.skillInventory.length, 11);
  assert.match(validateStudentProfile(profile), /at most 10 items/);
});

test('profile validation rejects oversized list entries and summary text', () => {
  assert.match(
    validateStudentProfile(validProfile({ interests: 'x'.repeat(81) })),
    /at most 10 items of 80 characters or fewer/,
  );
  assert.match(
    validateStudentProfile(validProfile({ profileSummary: 'x'.repeat(1001) })),
    /1,000 characters or fewer/,
  );
});

test('profile normalization trims and deduplicates selected profile values', () => {
  const profile = validProfile({
    skillInventory: [' HTML ', 'HTML', ' CSS '],
    interests: ' Python, Accessibility, Python ',
  });

  assert.deepEqual(profile.skillInventory, ['HTML', 'CSS']);
  assert.deepEqual(profile.interests, ['Python', 'Accessibility']);
  assert.equal(validateStudentProfile(profile), null);
});
