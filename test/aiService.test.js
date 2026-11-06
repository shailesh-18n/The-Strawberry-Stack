const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  AiServiceError,
  buildAssistantReply,
  getAiConfiguration,
  getLocalReply,
} = require('../services/aiService');

test('assistant uses offline guidance when no provider configuration exists', () => {
  assert.equal(getAiConfiguration({}), null);
});

test('assistant rejects partial or insecure remote provider configuration', () => {
  assert.throws(
    () => getAiConfiguration({ AI_API_KEY: 'test-key' }),
    /configured AI service is incomplete/,
  );
  assert.throws(
    () => getAiConfiguration({
      AI_API_KEY: 'test-key',
      AI_API_URL: 'http://provider.example/api',
      AI_MODEL: 'test-model',
    }),
    /must use HTTPS/,
  );
});

test('assistant accepts configured HTTPS OpenAI-compatible endpoints', () => {
  const configuration = getAiConfiguration({
    AI_API_KEY: 'test-key',
    AI_API_URL: 'https://provider.example/v1/chat/completions',
    AI_MODEL: 'test-model',
  });

  assert.equal(configuration.apiUrl, 'https://provider.example/v1/chat/completions');
  assert.equal(configuration.model, 'test-model');
  assert.equal(configuration.provider, 'openai-compatible');
});

test('assistant derives the model from a model-specific Gemini endpoint URL', () => {
  const configuration = getAiConfiguration({
    AI_API_KEY: 'test-key',
    AI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent',
  });

  assert.equal(configuration.provider, 'gemini');
  assert.equal(configuration.model, 'gemini-test');
});

test('assistant rejects API credentials embedded in endpoint URLs', () => {
  assert.throws(
    () => getAiConfiguration({
      AI_API_KEY: 'test-key',
      AI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent?key=not-for-use',
    }),
    /Do not put AI credentials in the API URL/,
  );
});

test('offline assistant replies in the selected vernacular and uses a personalized roadmap', () => {
  const navigator = {
    recommendation: {
      career: { name: 'Python Developer' },
      roadmap: [
        { skill: 'Functions', activity: 'Practice reusable functions.' },
        { skill: 'Testing', activity: 'Write tests.' },
      ],
      missingSkills: ['Functions', 'Testing'],
    },
  };
  const english = getLocalReply({
    preferredLanguage: 'English',
    aspirations: ['Python Developer'],
  }, 'What is my roadmap?', navigator);
  const bengali = getLocalReply({
    preferredLanguage: 'Bengali',
    aspirations: ['Python Developer'],
  }, 'পরবর্তী ধাপ কী?', navigator);

  assert.equal(english.mode, 'offline');
  assert.match(english.answer, /Python Developer/);
  assert.match(english.answer, /Functions, Testing/);
  assert.equal(bengali.language, 'Bengali');
  assert.match(bengali.answer, /লক্ষ্যের জন্য/);
  assert.match(bengali.answer, /Functions, Testing/);
});

test('configured assistant provider receives only non-identifying skill context', async () => {
  const savedEnvironment = {
    AI_API_KEY: process.env.AI_API_KEY,
    AI_API_URL: process.env.AI_API_URL,
    AI_MODEL: process.env.AI_MODEL,
  };
  const originalFetch = global.fetch;
  let requestOptions;
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_API_URL = 'https://provider.example/v1/chat/completions';
  process.env.AI_MODEL = 'test-model';
  global.fetch = async (_url, options) => {
    requestOptions = options;
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Practice functions next.' } }] }),
    };
  };

  try {
    const reply = await buildAssistantReply({
      name: 'Private Student Name',
      email: 'private@example.test',
      preferredLanguage: 'English',
      skillInventory: ['HTML'],
    }, 'What next?', 'English', {
      recommendation: {
        career: { name: 'Web Developer' },
        matchingSkills: ['HTML'],
        missingSkills: ['CSS'],
        roadmap: [{ skill: 'CSS', activity: 'Style a small page.' }],
      },
    });
    const payload = JSON.parse(requestOptions.body);

    assert.equal(reply.mode, 'ai');
    assert.equal(reply.answer, 'Practice functions next.');
    assert.equal(requestOptions.headers.authorization, 'Bearer test-key');
    assert.match(payload.messages[1].content, /Web Developer/);
    assert.doesNotMatch(payload.messages[1].content, /Private Student Name|private@example\.test/);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(savedEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('Gemini requests use the URL model, server-side key header, and simple context prompt', async () => {
  const savedEnvironment = {
    AI_API_KEY: process.env.AI_API_KEY,
    AI_API_URL: process.env.AI_API_URL,
    AI_MODEL: process.env.AI_MODEL,
  };
  const originalFetch = global.fetch;
  let requestUrl;
  let requestOptions;
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent';
  delete process.env.AI_MODEL;
  global.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Start with a small CSS exercise.' }] } }],
      }),
    };
  };

  try {
    const reply = await buildAssistantReply({
      name: 'Private Student Name',
      email: 'private@example.test',
      preferredLanguage: 'English',
      skillInventory: ['HTML'],
    }, 'Explain my next step simply.', 'English', {
      recommendation: {
        career: { name: 'Web Developer' },
        matchingSkills: ['HTML'],
        missingSkills: ['CSS'],
        roadmap: [{ skill: 'CSS', activity: 'Style a small page.' }],
      },
    });
    const payload = JSON.parse(requestOptions.body);

    assert.equal(reply.mode, 'ai');
    assert.equal(reply.answer, 'Start with a small CSS exercise.');
    assert.match(requestUrl, /models\/gemini-test:generateContent/);
    assert.equal(requestOptions.headers['x-goog-api-key'], 'test-key');
    assert.equal('authorization' in requestOptions.headers, false);
    assert.equal(payload.generationConfig.maxOutputTokens, 450);
    assert.match(payload.systemInstruction.parts[0].text, /Explain concepts simply/);
    assert.match(payload.contents[0].parts[0].text, /Web Developer/);
    assert.doesNotMatch(payload.contents[0].parts[0].text, /Private Student Name|private@example\.test/);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(savedEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('configured assistant provider failures are surfaced', async () => {
  const savedEnvironment = {
    AI_API_KEY: process.env.AI_API_KEY,
    AI_API_URL: process.env.AI_API_URL,
    AI_MODEL: process.env.AI_MODEL,
  };
  const originalFetch = global.fetch;
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_API_URL = 'https://provider.example/v1/chat/completions';
  process.env.AI_MODEL = 'test-model';
  global.fetch = async () => {
    throw new Error('test network error');
  };

  try {
    await assert.rejects(
      buildAssistantReply({ preferredLanguage: 'English' }, 'Question', 'English', { recommendation: null }),
      (error) => error instanceof AiServiceError && /could not be reached/.test(error.message),
    );
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(savedEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
