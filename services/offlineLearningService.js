const lessons = [
  {
    skillSlug: 'html',
    category: 'Web development',
    level: 'starter',
    title: { English: 'Build a clear HTML page', Bengali: 'গোছানো HTML পেজ তৈরি করুন' },
    explanation: {
      English: 'HTML gives a web page its structure. Use headings for sections, paragraphs for related text, and links for navigation. Choose elements for their meaning, not only their appearance.',
      Bengali: 'HTML একটি ওয়েব পেজের কাঠামো তৈরি করে। বিভাগ বোঝাতে শিরোনাম, লেখা বোঝাতে অনুচ্ছেদ এবং অন্য পেজে যেতে লিংক ব্যবহার করুন। শুধু চেহারা নয়, অর্থ বুঝে উপযুক্ত উপাদান বেছে নিন।',
    },
    activity: {
      English: 'Create a page about a topic you enjoy. Add one main heading, two section headings, a short paragraph, and a link with descriptive text.',
      Bengali: 'আপনার পছন্দের একটি বিষয় নিয়ে পেজ তৈরি করুন। একটি প্রধান শিরোনাম, দুটি বিভাগের শিরোনাম, ছোট অনুচ্ছেদ এবং স্পষ্ট বর্ণনাসহ একটি লিংক যোগ করুন।',
    },
    check: {
      English: 'Can someone understand the page structure from its headings alone?',
      Bengali: 'শুধু শিরোনামগুলো দেখেই কি কেউ পেজের কাঠামো বুঝতে পারবে?',
    },
    quiz: {
      question: {
        English: 'Which HTML element gives the main heading of a page?',
        Bengali: 'পেজের প্রধান শিরোনামের জন্য কোন HTML উপাদান ব্যবহার করা হয়?',
      },
      options: [
        { value: 'h1', label: { English: '<h1>', Bengali: '<h1>' } },
        { value: 'p', label: { English: '<p>', Bengali: '<p>' } },
        { value: 'a', label: { English: '<a>', Bengali: '<a>' } },
      ],
      answer: 'h1',
      explanation: {
        English: '<h1> identifies the page’s top-level heading.',
        Bengali: '<h1> পেজের সর্বোচ্চ স্তরের শিরোনাম নির্দেশ করে।',
      },
    },
  },
  {
    skillSlug: 'css',
    category: 'Web development',
    level: 'starter',
    title: { English: 'Style a page with CSS', Bengali: 'CSS দিয়ে পেজ সাজান' },
    explanation: {
      English: 'CSS controls how HTML content looks and is arranged. A rule selects an element and applies readable choices such as color, spacing, and layout. Keep text contrast strong and spacing consistent.',
      Bengali: 'CSS দিয়ে HTML কনটেন্টের চেহারা ও বিন্যাস ঠিক করা হয়। একটি নিয়ম উপাদান বেছে নিয়ে রং, ফাঁকা জায়গা ও বিন্যাসের মতো বৈশিষ্ট্য নির্ধারণ করে। লেখার বৈপরীত্য স্পষ্ট এবং ফাঁকা জায়গা একই রকম রাখুন।',
    },
    activity: {
      English: 'Take your HTML page and add a CSS rule for the body, headings, and links. Change spacing and colors, then check that all text remains easy to read.',
      Bengali: 'আপনার HTML পেজে body, শিরোনাম ও লিংকের জন্য CSS নিয়ম যোগ করুন। ফাঁকা জায়গা ও রং বদলান, তারপর সব লেখা সহজে পড়া যায় কি না দেখুন।',
    },
    check: {
      English: 'Which CSS change made the page easier to read, and why?',
      Bengali: 'কোন CSS পরিবর্তনে পেজটি পড়তে সহজ হয়েছে, এবং কেন?',
    },
    quiz: {
      question: {
        English: 'Which CSS property changes the space inside an element’s border?',
        Bengali: 'কোন CSS বৈশিষ্ট্য উপাদানের বর্ডারের ভেতরের ফাঁকা জায়গা বদলায়?',
      },
      options: [
        { value: 'padding', label: { English: 'padding', Bengali: 'padding' } },
        { value: 'margin', label: { English: 'margin', Bengali: 'margin' } },
        { value: 'color', label: { English: 'color', Bengali: 'color' } },
      ],
      answer: 'padding',
      explanation: {
        English: 'Padding is the space between an element’s content and its border.',
        Bengali: 'Padding হলো উপাদানের কনটেন্ট ও বর্ডারের মাঝের ফাঁকা জায়গা।',
      },
    },
  },
  {
    skillSlug: 'javascript',
    category: 'Programming',
    level: 'starter',
    title: { English: 'Add a small interaction', Bengali: 'ছোট একটি ইন্টারঅ্যাকশন যোগ করুন' },
    explanation: {
      English: 'JavaScript lets a page respond to actions. A button can listen for a click and then update a message. Start with one clear action and give feedback that users can see.',
      Bengali: 'JavaScript ব্যবহারকারীর কাজের প্রতি পেজকে সাড়া দিতে সাহায্য করে। একটি বাটন ক্লিক শুনে বার্তা বদলাতে পারে। একটি সহজ কাজ দিয়ে শুরু করুন এবং ব্যবহারকারী যেন পরিবর্তনটি দেখতে পান।',
    },
    activity: {
      English: 'Plan a button that changes a short message when clicked. Write down the starting message, the action, and the message the user should see afterward.',
      Bengali: 'ক্লিক করলে ছোট বার্তা বদলায় এমন একটি বাটনের পরিকল্পনা করুন। শুরুর বার্তা, ব্যবহারকারীর কাজ এবং পরে দেখা যাবে এমন বার্তাটি লিখে রাখুন।',
    },
    check: {
      English: 'What feedback tells the user that their action worked?',
      Bengali: 'ব্যবহারকারীর কাজ সফল হয়েছে—এটি কোন প্রতিক্রিয়া দেখে বোঝা যাবে?',
    },
    quiz: {
      question: {
        English: 'Which event commonly runs code after a user presses a button?',
        Bengali: 'ব্যবহারকারী বাটন চাপার পর কোন ইভেন্টে সাধারণত কোড চলে?',
      },
      options: [
        { value: 'click', label: { English: 'click', Bengali: 'click' } },
        { value: 'paint', label: { English: 'paint', Bengali: 'paint' } },
        { value: 'color', label: { English: 'color', Bengali: 'color' } },
      ],
      answer: 'click',
      explanation: {
        English: 'A click event lets a button respond to a user’s action.',
        Bengali: 'click ইভেন্ট ব্যবহারকারীর কাজের উত্তরে বাটনকে সাড়া দিতে দেয়।',
      },
    },
  },
];

const lessonSlugs = new Set(lessons.map((lesson) => lesson.skillSlug));

function getOfflineLearningPack() {
  return { version: 1, lessons };
}

function normalizeCompletedSkills(value) {
  if (!Array.isArray(value) || value.length > lessonSlugs.size) return null;
  if (value.some((slug) => typeof slug !== 'string' || !lessonSlugs.has(slug))) return null;
  return [...new Set(value)];
}

module.exports = {
  getOfflineLearningPack,
  normalizeCompletedSkills,
};
