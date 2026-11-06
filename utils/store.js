const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { seedCareerData, seedAssessmentConfigs } = require('../services/seedService');

const store = {
  users: [],
  careers: [],
  assessments: [],
  credentials: [],
  records: [],
  initialized: false,
};

const ensureInitialized = () => {
  if (store.initialized) return;

  store.careers = seedCareerData();
  store.assessments = seedAssessmentConfigs();
  store.initialized = true;
};

const uid = () => crypto.randomUUID();

const listCareers = () => {
  ensureInitialized();
  return store.careers;
};

const getCareerBySlug = (slug) => {
  ensureInitialized();
  return store.careers.find((career) => career.slug === slug) || null;
};

const getUserByEmail = (email) => {
  ensureInitialized();
  return store.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
};

const getUserById = (id) => {
  ensureInitialized();
  return store.users.find((user) => user.id === id) || null;
};

const createUser = (payload) => {
  ensureInitialized();
  const user = {
    id: uid(),
    name: payload.name,
    email: payload.email,
    passwordHash: payload.passwordHash,
    preferredLanguage: payload.preferredLanguage || 'Bengali',
    interests: payload.interests || [],
    aspirations: payload.aspirations || [],
    skillInventory: payload.skillInventory || [],
    educationLevel: payload.educationLevel || 'Intermediate',
    learningPreferences: payload.learningPreferences || [],
    accessNeeds: payload.accessNeeds || [],
    profileSummary: payload.profileSummary || '',
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  return user;
};

const createAssessmentRecord = (payload) => {
  ensureInitialized();
  const record = {
    id: payload.id || uid(),
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  };
  store.assessments.push(record);
  return record;
};

const getAssessmentById = (id) => {
  ensureInitialized();
  return store.assessments.find((assessment) => assessment.id === id) || null;
};

const createProgressRecord = (payload) => {
  ensureInitialized();
  const record = {
    id: payload.id || uid(),
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  };
  store.records.push(record);
  return record;
};

const listProgressRecords = (userId) => {
  ensureInitialized();
  return store.records.filter((record) => record.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const createCredential = (payload) => {
  ensureInitialized();
  const credential = {
    id: payload.id || uid(),
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  };
  store.credentials.push(credential);
  return credential;
};

const listCredentials = (userId) => {
  ensureInitialized();
  return store.credentials.filter((credential) => credential.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getCredentialById = (id) => {
  ensureInitialized();
  return store.credentials.find((credential) => credential.id === id) || null;
};

const seedDemoUser = () => {
  ensureInitialized();
  const existing = getUserByEmail('vivek@vidyachain.app');
  if (existing) return existing;

  return createUser({
    name: 'Vivek Das',
    email: 'vivek@vidyachain.app',
    passwordHash: bcrypt.hashSync(crypto.randomUUID(), 10),
    preferredLanguage: 'Bengali',
    interests: ['Python', 'Web development', 'AI'],
    aspirations: ['Python Developer'],
    skillInventory: ['Python basics', 'Problem solving', 'Communication'],
    educationLevel: 'Higher Secondary',
    learningPreferences: ['Project-based learning', 'Step-by-step guidance'],
    accessNeeds: ['Low-bandwidth mode'],
    profileSummary: 'Aspiring Python developer from a small-town background.',
  });
};

module.exports = {
  listCareers,
  getCareerBySlug,
  getUserByEmail,
  getUserById,
  createUser,
  createAssessmentRecord,
  getAssessmentById,
  createProgressRecord,
  listProgressRecords,
  createCredential,
  listCredentials,
  getCredentialById,
  seedDemoUser,
  store,
};
