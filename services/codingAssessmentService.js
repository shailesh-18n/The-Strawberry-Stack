const codingChallenges = new Map([
  ['python-sum', {
    id: 'python-sum',
    title: 'Python List Sum',
    skillSlug: 'python-basics',
    statement: 'Read an integer N, then N space-separated integers. Print their sum. When N is zero, print 0.',
    starterCode: 'n = int(input())\nvalues = list(map(int, input().split())) if n else []\nprint(sum(values))',
    compiler: 'python-3.14',
    timeLimit: 3,
    tests: [
      { input: '3\n1 2 3\n', expected_output: '6\n', hidden: false },
      { input: '5\n-4 10 0 7 3\n', expected_output: '16\n', hidden: true },
      { input: '0\n\n', expected_output: '0\n', hidden: true },
      { input: '1\n-5\n', expected_output: '-5\n', hidden: true },
    ],
  }],
]);

function getCodingChallenge(challengeId) {
  return codingChallenges.get(challengeId) || null;
}

module.exports = { getCodingChallenge };
