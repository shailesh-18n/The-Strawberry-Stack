const API_URL = 'https://api.onlinecompiler.io/api/run-tests/';
const MAX_SOURCE_BYTES = 8 * 1024;
const MAX_PROVIDER_RESPONSE_BYTES = 64 * 1024;
const MAX_DISPLAY_OUTPUT = 1200;

class OnlineCompilerError extends Error {
  constructor(kind, statusCode, message) {
    super(message);
    this.name = 'OnlineCompilerError';
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

function validateSource(code) {
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new OnlineCompilerError('invalid_submission', 400, 'Enter Python code before submitting.');
  }
  if (code.includes('\0') || Buffer.byteLength(code, 'utf8') > MAX_SOURCE_BYTES) {
    throw new OnlineCompilerError('invalid_submission', 400, 'Code must be valid UTF-8 text no larger than 8 KB.');
  }
}

function normalizeResponse(payload, expectedTests) {
  if (!payload || !Array.isArray(payload.tests) || payload.tests.length !== expectedTests.length) {
    throw new OnlineCompilerError('invalid_response', 502, 'The execution service returned an invalid result. Please try again.');
  }

  const tests = payload.tests.map((test, index) => {
    if (!test || typeof test.verdict !== 'string') {
      throw new OnlineCompilerError('invalid_response', 502, 'The execution service returned an invalid result. Please try again.');
    }
    const hidden = expectedTests[index].hidden === true;
    return {
      number: index + 1,
      hidden,
      verdict: test.verdict.slice(0, 40),
      passed: test.verdict === 'accepted',
      output: hidden ? '' : String(test.output || '').slice(0, MAX_DISPLAY_OUTPUT),
      error: hidden ? '' : String(test.error || '').slice(0, MAX_DISPLAY_OUTPUT),
    };
  });
  const score = Number(payload.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new OnlineCompilerError('invalid_response', 502, 'The execution service returned an invalid score. Please try again.');
  }
  const passedTests = tests.filter((test) => test.passed).length;
  const verdict = typeof payload.verdict === 'string' ? payload.verdict.slice(0, 40) : 'internal_error';
  return {
    submissionId: typeof payload.submission === 'string' ? payload.submission.slice(0, 100) : '',
    score,
    verdict,
    passedTests,
    totalTests: expectedTests.length,
    success: verdict === 'accepted' && passedTests === expectedTests.length && score === 100,
    tests,
    compileError: String(payload.compile_error || '').slice(0, MAX_DISPLAY_OUTPUT),
  };
}

async function readBoundedJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing response body');
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PROVIDER_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('Provider response exceeds the allowed size');
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks, totalBytes).toString('utf8'));
}

async function runTests({ code, challenge, submissionKey, fetchImpl = globalThis.fetch }) {
  validateSource(code);
  if (!challenge || typeof challenge.compiler !== 'string' || !Array.isArray(challenge.tests)) {
    throw new OnlineCompilerError('invalid_challenge', 500, 'This coding challenge is not configured correctly.');
  }
  const apiKey = process.env.ONLINECOMPILER_API_KEY?.trim();
  if (!apiKey) {
    throw new OnlineCompilerError('not_configured', 503, 'Code execution is temporarily unavailable.');
  }
  if (!/^[\x21-\x7e]{1,100}$/.test(submissionKey || '')) {
    throw new OnlineCompilerError('invalid_submission', 400, 'Refresh the assessment page and try again.');
  }

  const body = {
    compiler: challenge.compiler,
    code,
    tests: challenge.tests,
    time_limit: challenge.timeLimit,
    checker: 'trim',
    scoring: 'percent',
  };

  let response;
  try {
    response = await fetchImpl(API_URL, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': submissionKey,
      },
      body: JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(55_000),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new OnlineCompilerError('timeout', 504, 'Code execution took too long to respond. Retry this submission.');
    }
    throw new OnlineCompilerError('provider_unavailable', 503, 'The code execution service could not be reached. Please try again.');
  }

  if (response.status === 429) {
    await response.body?.cancel();
    throw new OnlineCompilerError('rate_limited', 429, 'The code execution service is busy or its free allowance is temporarily exhausted. Please wait and try again.');
  }
  if ([401, 403, 404].includes(response.status)) {
    await response.body?.cancel();
    throw new OnlineCompilerError('provider_auth', 503, 'Code execution is temporarily unavailable because the provider rejected its server configuration.');
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new OnlineCompilerError(
      response.status === 400 ? 'provider_rejected' : 'provider_unavailable',
      response.status === 400 ? 502 : 503,
      response.status === 400
        ? 'The execution service rejected this submission. Check the code and try again.'
        : 'The execution service is temporarily unavailable. Please try again.',
    );
  }

  let payload;
  try {
    payload = await readBoundedJson(response);
  } catch {
    throw new OnlineCompilerError('invalid_response', 502, 'The execution service returned an invalid or oversized result. Please try again.');
  }
  return normalizeResponse(payload, challenge.tests);
}

module.exports = {
  MAX_SOURCE_BYTES,
  OnlineCompilerError,
  runTests,
  validateSource,
};
