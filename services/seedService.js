const careerSeed = [
  {
    id: 'python-developer',
    name: 'Python Developer',
    slug: 'python-developer',
    description: 'Build software, automation tools, and data-focused solutions using Python.',
    skills: ['Python basics', 'Functions', 'Data structures', 'Debugging', 'APIs', 'Testing'],
    prerequisites: ['Problem solving', 'Logical thinking'],
    level: 'starter',
    roadmap: [
      'Learn Python syntax and data structures.',
      'Build functions for real tasks such as CSV processing or automation.',
      'Practice APIs, tests, and debugging before building larger projects.',
    ],
  },
  {
    id: 'web-developer',
    name: 'Web Developer',
    slug: 'web-developer',
    description: 'Create responsive websites and web apps for user-facing products.',
    skills: ['HTML', 'CSS', 'JavaScript', 'Responsive design', 'APIs', 'Testing'],
    prerequisites: ['Communication', 'Design awareness'],
    level: 'starter',
    roadmap: [
      'Master HTML, CSS, and JavaScript fundamentals.',
      'Build small UI projects and understand browser behavior.',
      'Learn backend integration and deployment basics.',
    ],
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    slug: 'data-analyst',
    description: 'Analyze trends, tell useful stories with data, and support decision making.',
    skills: ['Statistics', 'Excel', 'SQL', 'Visualization', 'Communication'],
    prerequisites: ['Logical reasoning', 'Curiosity'],
    level: 'starter',
    roadmap: [
      'Understand data types and basic statistics.',
      'Work with spreadsheets and charts.',
      'Practice structured analysis and communicating insights.',
    ],
  },
];

const assessments = [
  {
    id: 'python-basics',
    title: 'Python Basics Challenge',
    skill: 'Python basics',
    language: 'python',
    instructions: 'Write a function named solve(data) that returns the sum of all numbers in a list.',
    starterCode: 'def solve(data):\n    # write your answer here\n    return 0\n',
    tests: [
      { input: [1, 2, 3], expected: 6 },
      { input: [5, 10, 15], expected: 30 },
      { input: [0, -2, 2], expected: 0 },
    ],
  },
  {
    id: 'string-logic',
    title: 'String Logic Challenge',
    skill: 'Problem solving',
    language: 'python',
    instructions: 'Write a function named solve(text) that returns the number of vowels in the string.',
    starterCode: 'def solve(text):\n    # write your answer here\n    return 0\n',
    tests: [
      { input: 'hello', expected: 2 },
      { input: 'aeiou', expected: 5 },
      { input: 'rhythm', expected: 0 },
    ],
  },
];

const seedCareerData = () => careerSeed;
const seedAssessmentConfigs = () => assessments;

module.exports = {
  seedCareerData,
  seedAssessmentConfigs,
};
