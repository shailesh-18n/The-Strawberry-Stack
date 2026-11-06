const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  OnlineCompilerError,
  runTests,
  validateSource,
} = require('../services/onlineCompilerService');

const challenge = {
  compiler: 'python-3.14',
  timeLimit: 3,
  tests: [
    { input: '2\n1 2\n', expected_output: '3\n', hidden: false },
    { input: '0\n\n', expected_output: '0\n', hidden: true },
  ],
};

function providerResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('OnlineCompiler uses the documented authenticated run-tests request', async () => {
  const previousKey = process.env.ONLINECOMPILER_API_KEY;
  process.env.ONLINECOMPILER_API_KEY = 'test-only-provider-key';
  let call;
  try {
    const result = await runTests({
      code: 'print(3)',
      challenge,
      submissionKey: 'opaque-assessment-id',
      fetchImpl: async (url, options) => {
        call = { url, options, body: JSON.parse(options.body) };
        return providerResponse({
          verdict: 'wrong_answer',
          score: 50,
          passed: 1,
          total: 2,
          submission: 'sub_test',
          tests: [
            { verdict: 'accepted', hidden: false, output: '3\n', error: '' },
            { verdict: 'wrong_answer', hidden: true, output: 'must-not-display', error: 'must-not-display' },
          ],
        });
      },
    });

    assert.equal(call.url, 'https://api.onlinecompiler.io/api/run-tests/');
    assert.equal(call.options.method, 'POST');
    assert.equal(call.options.headers.Authorization, 'test-only-provider-key');
    assert.equal(call.options.headers['Content-Type'], 'application/json');
    assert.equal(call.options.headers['Idempotency-Key'], 'opaque-assessment-id');
    assert.equal(call.options.redirect, 'error');
    assert.deepEqual(call.body, {
      compiler: 'python-3.14',
      code: 'print(3)',
      tests: challenge.tests,
      time_limit: 3,
      checker: 'trim',
      scoring: 'percent',
    });
    assert.equal(result.score, 50);
    assert.equal(result.passedTests, 1);
    assert.equal(result.success, false);
    assert.equal(result.tests[1].hidden, true);
    assert.equal(result.tests[1].output, '');
    assert.equal(result.tests[1].error, '');
  } finally {
    if (previousKey === undefined) delete process.env.ONLINECOMPILER_API_KEY;
    else process.env.ONLINECOMPILER_API_KEY = previousKey;
  }
});

test('OnlineCompiler rejects missing configuration and invalid source without a request', async () => {
  const previousKey = process.env.ONLINECOMPILER_API_KEY;
  delete process.env.ONLINECOMPILER_API_KEY;
  let called = false;
  try {
    await assert.rejects(
      runTests({
        code: 'print(1)',
        challenge,
        submissionKey: 'opaque-assessment-id',
        fetchImpl: async () => {
          called = true;
          throw new Error('must not call provider');
        },
      }),
      (error) => error instanceof OnlineCompilerError && error.kind === 'not_configured',
    );
    assert.equal(called, false);
    assert.throws(() => validateSource(`x = "${'a'.repeat(8192)}"`), (error) => error.kind === 'invalid_submission');
    assert.throws(() => validateSource('print("\\0")\0'), (error) => error.kind === 'invalid_submission');
  } finally {
    if (previousKey === undefined) delete process.env.ONLINECOMPILER_API_KEY;
    else process.env.ONLINECOMPILER_API_KEY = previousKey;
  }
});

test('OnlineCompiler maps provider rate limits and request timeouts to safe errors', async () => {
  const previousKey = process.env.ONLINECOMPILER_API_KEY;
  process.env.ONLINECOMPILER_API_KEY = 'test-only-provider-key';
  try {
    await assert.rejects(
      runTests({
        code: 'print(1)',
        challenge,
        submissionKey: 'opaque-assessment-id',
        fetchImpl: async () => providerResponse({ error: 'private upstream detail' }, 429),
      }),
      (error) => error.kind === 'rate_limited' && error.statusCode === 429 && !error.message.includes('private upstream detail'),
    );
    await assert.rejects(
      runTests({
        code: 'print(1)',
        challenge,
        submissionKey: 'opaque-assessment-id',
        fetchImpl: async () => {
          throw Object.assign(new Error('timeout'), { name: 'TimeoutError' });
        },
      }),
      (error) => error.kind === 'timeout' && error.statusCode === 504,
    );
    await assert.rejects(
      runTests({
        code: 'print(1)',
        challenge,
        submissionKey: 'opaque-assessment-id',
        fetchImpl: async () => providerResponse({ error: 'Invalid or inactive API key' }, 404),
      }),
      (error) => error.kind === 'provider_auth' && error.statusCode === 503,
    );
  } finally {
    if (previousKey === undefined) delete process.env.ONLINECOMPILER_API_KEY;
    else process.env.ONLINECOMPILER_API_KEY = previousKey;
  }
});

test('OnlineCompiler rejects malformed provider results without exposing response content', async () => {
  const previousKey = process.env.ONLINECOMPILER_API_KEY;
  process.env.ONLINECOMPILER_API_KEY = 'test-only-provider-key';
  try {
    await assert.rejects(
      runTests({
        code: 'print(1)',
        challenge,
        submissionKey: 'opaque-assessment-id',
        fetchImpl: async () => providerResponse({
          error: 'private upstream detail',
          verdict: 'accepted',
          score: 100,
          tests: [],
        }),
      }),
      (error) => error.kind === 'invalid_response' && !error.message.includes('private upstream detail'),
    );
  } finally {
    if (previousKey === undefined) delete process.env.ONLINECOMPILER_API_KEY;
    else process.env.ONLINECOMPILER_API_KEY = previousKey;
  }
});

test('OnlineCompiler rejects oversized provider responses without returning their content', async () => {
  const previousKey = process.env.ONLINECOMPILER_API_KEY;
  process.env.ONLINECOMPILER_API_KEY = 'test-only-provider-key';
  try {
    await assert.rejects(
      runTests({
        code: 'print(1)',
        challenge,
        submissionKey: 'opaque-assessment-id',
        fetchImpl: async () => new Response(`{"padding":"${'x'.repeat(65 * 1024)}"}`),
      }),
      (error) => error.kind === 'invalid_response' && !error.message.includes('padding'),
    );
  } finally {
    if (previousKey === undefined) delete process.env.ONLINECOMPILER_API_KEY;
    else process.env.ONLINECOMPILER_API_KEY = previousKey;
  }
});
