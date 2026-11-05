const { getCareerRecommendations } = require('./careerService');

function buildAssistantReply(user, question, language = 'Bengali') {
  if (!user) {
    return {
      answer: 'Please sign in to get a personalized roadmap and guidance.',
      language,
    };
  }

  const normalizedQuestion = String(question || '').toLowerCase();
  const rec = getCareerRecommendations(user);
  const goal = rec.career?.name || 'your target career';

  if (normalizedQuestion.includes('roadmap') || normalizedQuestion.includes('next step')) {
    return {
      answer: language === 'Bengali'
        ? `আপনার ${goal} লক্ষ্যে চলার জন্য প্রথম ধাপ হচ্ছে: ${rec.roadmap.join(' ➜ ')}। আপনি একটি ছোট, বাস্তব প্রকল্প তৈরি করে প্রতিটি ধাপ অনুশীলন করতে পারেন।`
        : `For ${goal}, start with: ${rec.roadmap.join(' → ')}. Practice each step with a small real-world project so the skills stick.`,
      language,
    };
  }

  if (normalizedQuestion.includes('career') || normalizedQuestion.includes('job')) {
    return {
      answer: language === 'Bengali'
        ? `${goal} আপনার আগ্রহ এবং বর্তমান দক্ষতার সাথে সবচেয়ে মানানসই পছন্দ। আপনার গ্যাপ হলো: ${rec.missingSkills.join(', ') || 'কোনো বড় ফাঁক নেই'}; এই ফাঁক পূরণ করলে আপনি দ্রুত এগিয়ে যেতে পারবেন।`
        : `${goal} is a strong fit for your interests and current skills. The main gaps are: ${rec.missingSkills.join(', ') || 'No major gap detected'}; closing them will speed up your progress.`,
      language,
    };
  }

  if (normalizedQuestion.includes('python') || normalizedQuestion.includes('code')) {
    return {
      answer: language === 'Bengali'
        ? 'Python-এ ছোট ছোট ফাংশন দিয়ে শুরু করুন। উদাহরণ: একটি list-এর যোগফল বের করার জন্য `def solve(data): return sum(data)` লিখুন; তারপর test cases দিয়ে যাচাই করুন।'
        : 'Start with small Python functions. Example: `def solve(data): return sum(data)` and verify it with test cases before moving to larger projects.',
      language,
    };
  }

  return {
    answer: language === 'Bengali'
      ? `আপনার লক্ষ্য ${goal}। আপনার বর্তমান দক্ষতা দিয়ে আপনি ${rec.missingSkills.length ? rec.missingSkills.join(', ') : 'কিছু গুরুত্বপূর্ণ দক্ষতা'} শিখতে পারবেন। প্রতিটি সপ্তাহে একটি ছোট প্রকল্প এবং একটি assessment দিয়ে আপনার অগ্রগতি পরিমাপ করুন।`
      : `Your target is ${goal}. Use your current strengths to build the next milestones: ${rec.missingSkills.length ? rec.missingSkills.join(', ') : 'core fundamentals'}; measuring your progress with small projects and assessments will help you improve faster.`,
    language,
  };
}

module.exports = {
  buildAssistantReply,
};
