const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  getOfflineLearningPack,
  normalizeCompletedSkills,
} = require('../services/offlineLearningService');

test('offline lesson pack contains bilingual explanations, activities, and checks', () => {
  const pack = getOfflineLearningPack();

  assert.equal(pack.version, 1);
  assert.deepEqual(pack.lessons.map((lesson) => lesson.skillSlug), ['html', 'css', 'javascript']);
  for (const lesson of pack.lessons) {
    for (const field of ['title', 'explanation', 'activity', 'check']) {
      assert.equal(typeof lesson[field].English, 'string');
      assert.equal(typeof lesson[field].Bengali, 'string');
      assert.ok(lesson[field].English.length > 0);
      assert.ok(lesson[field].Bengali.length > 0);
    }
    assert.ok(lesson.quiz.question.English);
    assert.ok(lesson.quiz.question.Bengali);
    assert.ok(lesson.quiz.options.some((option) => option.value === lesson.quiz.answer));
    assert.ok(lesson.quiz.explanation.English);
    assert.ok(lesson.quiz.explanation.Bengali);
  }
});

test('offline learner UI uses IndexedDB, queues completion, and reports sync conflicts', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'offline-learning.js'), 'utf8');

  assert.match(script, /indexedDB\.open/);
  assert.match(script, /vidyachain-offline-learning-v1/);
  assert.match(script, /pendingSkills/);
  assert.match(script, /window\.addEventListener\('online', syncProgress\)/);
  assert.match(script, /completion-wins|completion conflict was merged/);
  assert.match(script, /offline-quiz/);
  assert.match(script, /Check answer/);
});

test('offline progress accepts only the packaged lesson slugs', () => {
  assert.deepEqual(normalizeCompletedSkills(['html', 'css', 'html']), ['html', 'css']);
  assert.deepEqual(normalizeCompletedSkills([]), []);
  assert.equal(normalizeCompletedSkills(['unknown-skill']), null);
  assert.equal(normalizeCompletedSkills(['html', 42]), null);
  assert.equal(normalizeCompletedSkills('html'), null);
  assert.equal(normalizeCompletedSkills(['html', 'css', 'javascript', 'html']), null);
});

test('service worker caches only the offline lesson pack and never private pages', async () => {
  const listeners = new Map();
  const cachedRequests = [];
  const deletedCaches = [];
  let fetchCalls = 0;
  const cacheNames = [
    'vidyachain-v1',
    'vidyachain-offline-learning-v2',
    'vidyachain-offline-learning-v3',
    'unrelated-cache',
  ];
  const cache = {
    addAll: async () => {},
    match: async (request) => {
      cachedRequests.push(request.url || request);
      return String(request.url || request).endsWith('/public/offline-learning.html')
        ? { offlineShell: true }
        : undefined;
    },
  };
  const context = {
    URL,
    Promise,
    self: {
      location: { origin: 'https://vidyachain.test' },
      clients: { claim: async () => {} },
      skipWaiting: async () => {},
      addEventListener: (name, callback) => listeners.set(name, callback),
    },
    caches: {
      open: async () => cache,
      keys: async () => cacheNames,
      delete: async (name) => {
        deletedCaches.push(name);
        return true;
      },
    },
    fetch: async () => {
      fetchCalls += 1;
      return { fromNetwork: true };
    },
  };
  const workerPath = path.join(__dirname, '..', 'public', 'sw.js');
  vm.runInNewContext(fs.readFileSync(workerPath, 'utf8'), context);

  let privateResponse;
  listeners.get('fetch')({
    request: {
      method: 'GET',
      mode: 'navigate',
      url: 'https://vidyachain.test/profile',
    },
    respondWith: (response) => { privateResponse = response; },
  });
  assert.deepEqual(await privateResponse, { fromNetwork: true });
  assert.deepEqual(cachedRequests, []);
  assert.equal(fetchCalls, 1);

  let offlineResponse;
  context.fetch = async () => { throw new Error('offline'); };
  listeners.get('fetch')({
    request: {
      method: 'GET',
      mode: 'navigate',
      url: 'https://vidyachain.test/career',
    },
    respondWith: (response) => { offlineResponse = response; },
  });
  assert.deepEqual(await offlineResponse, { offlineShell: true });
  assert.equal(cachedRequests.at(-1), '/public/offline-learning.html');

  let activationPromise;
  listeners.get('activate')({
    waitUntil: (promise) => { activationPromise = promise; },
  });
  await activationPromise;
  assert.deepEqual(deletedCaches, [
    'vidyachain-v1',
    'vidyachain-offline-learning-v2',
    'vidyachain-offline-learning-v3',
  ]);
});
