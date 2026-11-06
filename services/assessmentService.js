const { getAssessmentById } = require('../utils/store');

function evaluateSkillAssessment(challengeId, answers) {
  const challenge = getAssessmentById(challengeId);
  if (!challenge) {
    return { success: false, message: 'Challenge not found.', passedTests: 0, totalTests: 0 };
  }
  const submittedAnswers = answers && typeof answers === 'object' ? answers : {};
  const passedTests = challenge.questions.reduce((count, question, index) => (
    count + Number(submittedAnswers[`answer_${index}`] === question.answer)
  ), 0);
  const success = passedTests === challenge.questions.length;
  return {
    success,
    passedTests,
    totalTests: challenge.questions.length,
    message: success ? 'All questions answered correctly.' : 'Review the skill material and try again.',
  };
}

function evaluatePythonChallenge(challengeId) {
  if (!getAssessmentById(challengeId)) {
    return { success: false, message: 'Challenge not found.', passedTests: 0, totalTests: 0 };
  }
  return {
    success: false,
    message: 'Code submissions are not supported; use the guided assessment form.',
    passedTests: 0,
    totalTests: 0,
  };
}

module.exports = {
  evaluatePythonChallenge,
  evaluateSkillAssessment,
};
