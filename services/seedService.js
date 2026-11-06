const skills = [
  { slug: 'python-basics', name: 'Python basics', category: 'Programming', level: 'starter', aliases: ['python'], prerequisites: ['problem-solving', 'logical-thinking'], learningActivity: 'Write small Python expressions and solve simple input/output exercises.' },
  { slug: 'functions', name: 'Functions', category: 'Programming', level: 'starter', prerequisites: ['python-basics'], learningActivity: 'Create reusable functions with clear inputs, outputs, and names.' },
  { slug: 'data-structures', name: 'Data structures', category: 'Programming', level: 'starter', prerequisites: ['functions'], learningActivity: 'Practice lists, dictionaries, sets, and choosing a structure for a task.' },
  { slug: 'debugging', name: 'Debugging', category: 'Programming', level: 'starter', prerequisites: ['functions'], learningActivity: 'Reproduce a small bug, inspect values, and verify a fix with tests.' },
  { slug: 'apis', name: 'APIs', category: 'Software development', level: 'intermediate', prerequisites: ['data-structures'], learningActivity: 'Read an API response and build a small client that handles errors.' },
  { slug: 'testing', name: 'Testing', category: 'Software development', level: 'intermediate', prerequisites: ['functions'], learningActivity: 'Write focused tests for normal cases and edge cases.' },
  { slug: 'problem-solving', name: 'Problem solving', category: 'Core skills', level: 'starter', aliases: ['logical thinking'], learningActivity: 'Break a familiar task into smaller steps and explain the reasoning.' },
  { slug: 'logical-thinking', name: 'Logical thinking', category: 'Core skills', level: 'starter', prerequisites: ['problem-solving'], learningActivity: 'Trace a short sequence of decisions and describe why each follows.' },
  { slug: 'html', name: 'HTML', category: 'Web development', level: 'starter', prerequisites: ['design-awareness'], learningActivity: 'Build a semantic page with headings, links, forms, and landmarks.' },
  { slug: 'css', name: 'CSS', category: 'Web development', level: 'starter', learningActivity: 'Style a page with layout, spacing, and readable contrast.' },
  { slug: 'javascript', name: 'JavaScript', category: 'Programming', level: 'starter', learningActivity: 'Use variables, functions, arrays, and DOM events in a small page.' },
  { slug: 'responsive-design', name: 'Responsive design', category: 'Web development', level: 'intermediate', prerequisites: ['html', 'css'], learningActivity: 'Adapt a page for narrow and wide viewports and test keyboard access.' },
  { slug: 'design-awareness', name: 'Design awareness', category: 'Core skills', level: 'starter', learningActivity: 'Review a page for hierarchy, readability, and consistency.' },
  { slug: 'communication', name: 'Communication', category: 'Core skills', level: 'starter', learningActivity: 'Summarize a project decision and its evidence in a few clear sentences.' },
  { slug: 'statistics', name: 'Statistics', category: 'Data analysis', level: 'starter', prerequisites: ['logical-reasoning'], learningActivity: 'Calculate and explain averages, ranges, and simple distributions.' },
  { slug: 'excel', name: 'Excel', category: 'Data analysis', level: 'starter', learningActivity: 'Clean a small table and use formulas to summarize it.' },
  { slug: 'sql', name: 'SQL', category: 'Data analysis', level: 'starter', learningActivity: 'Query a sample table using SELECT, filtering, and grouping.' },
  { slug: 'visualization', name: 'Visualization', category: 'Data analysis', level: 'intermediate', prerequisites: ['statistics', 'sql'], learningActivity: 'Choose a chart for a question and explain what the data shows.' },
  { slug: 'curiosity', name: 'Curiosity', category: 'Core skills', level: 'starter', learningActivity: 'Turn an observation into a question that can be investigated.' },
  { slug: 'logical-reasoning', name: 'Logical reasoning', category: 'Core skills', level: 'starter', prerequisites: ['problem-solving'], learningActivity: 'Compare two possible explanations and identify supporting evidence.' },
];

const careers = [
  {
    slug: 'python-developer',
    name: 'Python Developer',
    description: 'Build software, automation tools, and data-focused solutions using Python.',
    level: 'starter',
    interestTags: ['python', 'programming', 'software', 'automation', 'coding'],
    requiredSkills: ['python-basics', 'functions', 'data-structures', 'debugging', 'apis', 'testing'],
  },
  {
    slug: 'web-developer',
    name: 'Web Developer',
    description: 'Create responsive websites and web apps for user-facing products.',
    level: 'starter',
    interestTags: ['web development', 'web', 'frontend', 'design', 'websites', 'javascript'],
    requiredSkills: ['html', 'css', 'javascript', 'responsive-design', 'apis', 'testing'],
  },
  {
    slug: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyze trends, tell useful stories with data, and support decision making.',
    level: 'starter',
    interestTags: ['data', 'data analysis', 'analytics', 'statistics', 'research', 'spreadsheets'],
    requiredSkills: ['statistics', 'excel', 'sql', 'visualization', 'communication'],
  },
];

const assessments = [
  {
    id: 'python-basics',
    title: 'Python Basics Challenge',
    skillSlug: 'python-basics',
    skill: 'Python basics',
    description: 'Check understanding of functions and basic Python collections.',
    questions: [
      {
        prompt: 'Which expression returns the sum of the values in data?',
        options: [
          { value: 'sum', label: 'return sum(data)' },
          { value: 'count', label: 'return len(data)' },
          { value: 'join', label: "return ','.join(data)" },
        ],
        answer: 'sum',
      },
      {
        prompt: 'What does sum([]) return in Python?',
        options: [
          { value: 'zero', label: '0' },
          { value: 'none', label: 'None' },
          { value: 'error', label: 'It always raises an error' },
        ],
        answer: 'zero',
      },
    ],
  },
  {
    id: 'string-logic',
    title: 'String Logic Challenge',
    skillSlug: 'problem-solving',
    skill: 'Problem solving',
    description: 'Practice breaking a small text-processing task into steps.',
    questions: [
      {
        prompt: 'How many vowels are in the word "hello"?',
        options: [
          { value: 'one', label: '1' },
          { value: 'two', label: '2' },
          { value: 'three', label: '3' },
        ],
        answer: 'two',
      },
      {
        prompt: 'Which is the best first step for counting vowels in any word?',
        options: [
          { value: 'inspect', label: 'Inspect each character and check whether it is a vowel' },
          { value: 'guess', label: 'Guess from the length of the word' },
          { value: 'reverse', label: 'Reverse the word and count its letters' },
        ],
        answer: 'inspect',
      },
    ],
  },
];

module.exports = {
  seedSkillData: () => skills,
  seedCareerData: () => careers,
  seedAssessmentConfigs: () => assessments,
};
