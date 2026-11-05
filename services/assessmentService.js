const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { getAssessmentById } = require('../utils/store');

function evaluatePythonChallenge(challengeId, code) {
  const challenge = getAssessmentById(challengeId);
  if (!challenge) {
    return {
      success: false,
      message: 'Challenge not found.',
    };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidyachain-'));
  const scriptPath = path.join(tempDir, 'submission.py');

  const harness = `
${code || ''}

for idx, case in enumerate(${JSON.stringify(challenge.tests)}):
    try:
        actual = solve(case["input"])
        expect = case["expected"]
        if actual != expect:
            raise AssertionError(f"Test {idx} failed: expected {expect}, got {actual}")
    except Exception as exc:
        print(f"FAIL:{idx}:{exc}")
        raise

print("PASS")
`;

  fs.writeFileSync(scriptPath, harness, 'utf8');
  const pythonBin = process.env.PYTHON_BIN || 'python';
  const result = spawnSync(pythonBin, [scriptPath], {
    encoding: 'utf8',
    timeout: 15000,
  });

  if (result.error) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  const output = (result.stdout || '').trim();
  const errorText = (result.stderr || '').trim();

  if (result.status !== 0) {
    return {
      success: false,
      message: errorText || output || 'Submission failed.',
      output,
    };
  }

  return {
    success: output === 'PASS',
    message: output === 'PASS' ? 'All tests passed.' : 'Assessment output did not match expectations.',
    output,
    passedTests: output === 'PASS' ? challenge.tests.length : 0,
    totalTests: challenge.tests.length,
  };
}

module.exports = {
  evaluatePythonChallenge,
};
