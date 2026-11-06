const lessons = [
  {
    skillSlug: 'html',
    category: 'Web development',
    level: 'starter',
    title: {
      English: 'Build a clear HTML page',
      Bengali: 'গোছানো HTML পেজ তৈরি করুন',
      Hindi: 'एक स्पष्ट HTML पेज बनाएं',
      Kannada: 'ಸ್ಪಷ್ಟವಾದ HTML ಪುಟವನ್ನು ರಚಿಸಿ',
    },
    explanation: {
      English: 'HTML gives a web page its structure. Use headings for sections, paragraphs for related text, and links for navigation. Choose elements for their meaning, not only their appearance.',
      Bengali: 'HTML একটি ওয়েব পেজের কাঠামো তৈরি করে। বিভাগ বোঝাতে শিরোনাম, লেখা বোঝাতে অনুচ্ছেদ এবং অন্য পেজে যেতে লিংক ব্যবহার করুন। শুধু চেহারা নয়, অর্থ বুঝে উপযুক্ত উপাদান বেছে নিন।',
      Hindi: 'HTML एक वेब पेज को उसकी संरचना देता है। अनुभागों के लिए शीर्षकों, संबंधित पाठ के लिए पैराग्राफ और नेविगेशन के लिए लिंक का उपयोग करें। तत्वों को केवल उनके रूप-रंग के लिए नहीं, बल्कि उनके अर्थ के लिए चुनें।',
      Kannada: 'HTML ವೆಬ್ ಪುಟಕ್ಕೆ ಅದರ ರಚನೆಯನ್ನು ನೀಡುತ್ತದೆ. ವಿಭಾಗಗಳಿಗೆ ಶೀರ್ಷಿಕೆಗಳನ್ನು, ಸಂಬಂಧಿತ ಪಠ್ಯಕ್ಕಾಗಿ ಪ್ಯಾರಾಗ್ರಾಫ್‌ಗಳನ್ನು ಮತ್ತು ನ್ಯಾವಿಗೇಷನ್‌ಗಾಗಿ ಲಿಂಕ್‌ಗಳನ್ನು ಬಳಸಿ. ಅಂಶಗಳನ್ನು ಅವುಗಳ ನೋಟಕ್ಕಾಗಿ ಮಾತ್ರವಲ್ಲದೆ ಅವುಗಳ ಅರ್ಥಕ್ಕಾಗಿ ಆಯ್ಕೆಮಾಡಿ.',
    },
    activity: {
      English: 'Create a page about a topic you enjoy. Add one main heading, two section headings, a short paragraph, and a link with descriptive text.',
      Bengali: 'আপনার পছন্দের একটি বিষয় নিয়ে পেজ তৈরি করুন। একটি প্রধান শিরোনাম, দুটি বিভাগের শিরোনাম, ছোট অনুচ্ছেদ এবং স্পষ্ট বর্ণনাসহ একটি লিংক যোগ করুন।',
      Hindi: 'अपनी पसंद के विषय पर एक पेज बनाएं। एक मुख्य शीर्षक, दो अनुभाग शीर्षक, एक छोटा पैराग्राफ और वर्णनात्मक पाठ वाला एक लिंक जोड़ें।',
      Kannada: 'ನೀವು ಇಷ್ಟಪಡುವ ವಿಷಯದ ಬಗ್ಗೆ ಒಂದು ಪುಟವನ್ನು ರಚಿಸಿ. ಒಂದು ಮುಖ್ಯ ಶೀರ್ಷಿಕೆ, ಎರಡು ವಿಭಾಗದ ಶೀರ್ಷಿಕೆಗಳು, ಒಂದು ಸಣ್ಣ ಪ್ಯಾರಾಗ್ರಾಫ್ ಮತ್ತು ವಿವರಣಾತ್ಮಕ ಪಠ್ಯವಿರುವ ಲಿಂಕ್ ಅನ್ನು ಸೇರಿಸಿ.',
    },
    check: {
      English: 'Can someone understand the page structure from its headings alone?',
      Bengali: 'শুধু শিরোনামগুলো দেখেই কি কেউ পেজের কাঠামো বুঝতে পারবে?',
      Hindi: 'क्या कोई केवल इसके शीर्षकों से पेज की संरचना को समझ सकता है?',
      Kannada: 'ಕೇವಲ ಅದರ ಶೀರ್ಷಿಕೆಗಳಿಂದಲೇ ಯಾರಾದರೂ ಪುಟದ ರಚನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬಹುದೇ?',
    },
    quiz: {
      question: {
        English: 'Which HTML element gives the main heading of a page?',
        Bengali: 'পেজের প্রধান শিরোনামের জন্য কোন HTML উপাদান ব্যবহার করা হয়?',
        Hindi: 'पेज का मुख्य शीर्षक देने के लिए किस HTML तत्व का उपयोग किया जाता है?',
        Kannada: 'ಪುಟದ ಮುಖ್ಯ ಶೀರ್ಷಿಕೆಯನ್ನು ಯಾವ HTML ಅಂಶವು ನೀಡುತ್ತದೆ?',
      },
      options: [
        { value: 'h1', label: { English: '<h1>', Bengali: '<h1>', Hindi: '<h1>', Kannada: '<h1>' } },
        { value: 'p', label: { English: '<p>', Bengali: '<p>', Hindi: '<p>', Kannada: '<p>' } },
        { value: 'a', label: { English: '<a>', Bengali: '<a>', Hindi: '<a>', Kannada: '<a>' } },
      ],
      answer: 'h1',
      explanation: {
        English: '<h1> identifies the page’s top-level heading.',
        Bengali: '<h1> পেজের সর্বোচ্চ স্তরের শিরোনাম নির্দেশ করে।',
        Hindi: '<h1> पेज के शीर्ष-स्तरीय मुख्य शीर्षक की पहचान करता है।',
        Kannada: '<h1> ಪುಟದ ಉನ್ನತ ಮಟ್ಟದ ಶೀರ್ಷಿಕೆಯನ್ನು ಗುರುತಿಸುತ್ತದೆ.',
      },
    },
  },
  {
    skillSlug: 'css',
    category: 'Web development',
    level: 'starter',
    title: {
      English: 'Style a page with CSS',
      Bengali: 'CSS দিয়ে পেজ সাজান',
      Hindi: 'CSS के साथ पेज को स्टाइल करें',
      Kannada: 'CSS ನೊಂದಿಗೆ ಪುಟವನ್ನು ಶೈಲೀಕರಿಸಿ',
    },
    explanation: {
      English: 'CSS controls how HTML content looks and is arranged. A rule selects an element and applies readable choices such as color, spacing, and layout. Keep text contrast strong and spacing consistent.',
      Bengali: 'CSS দিয়ে HTML কনটেন্টের চেহারা ও বিন্যাস ঠিক করা হয়। একটি নিয়ম উপাদান বেছে নিয়ে রং, ফাঁকা জায়গা ও বিন্যাসের মতো বৈশিষ্ট্য নির্ধারণ করে। লেখার বৈপরীত্য স্পষ্ট এবং ফাঁকা জায়গা একই রকম রাখুন।',
      Hindi: 'CSS नियंत्रित करता है कि HTML सामग्री कैसी दिखती है और कैसे व्यवस्थित होती है। एक नियम किसी तत्व का चयन करता है और रंग, रिक्ति (स्पेसिंग) और लेआउट जैसे पठनीय विकल्प लागू करता है। पाठ का कंट्रास्ट स्पष्ट और स्पेसिंग एकसमान रखें।',
      Kannada: 'CSS ಯು HTML ವಿಷಯವು ಹೇಗೆ ಕಾಣುತ್ತದೆ ಮತ್ತು ಹೇಗೆ ಜೋಡಿಸಲ್ಪಟ್ಟಿದೆ ಎಂಬುದನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ. ನಿಯಮವು ಒಂದು ಅಂಶವನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತದೆ ಮತ್ತು ಬಣ್ಣ, ಅಂತರ ಮತ್ತು ಲೇಔಟ್‌ನಂತಹ ಓದಬಲ್ಲ ಆಯ್ಕೆಗಳನ್ನು ಅನ್ವಯಿಸುತ್ತದೆ. ಪಠ್ಯ ಕಾಂಟ್ರಾಸ್ಟ್ ಅನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ಅಂತರವನ್ನು ಸ್ಥಿರವಾಗಿಡಿ.',
    },
    activity: {
      English: 'Take your HTML page and add a CSS rule for the body, headings, and links. Change spacing and colors, then check that all text remains easy to read.',
      Bengali: 'আপনার HTML পেজে body, শিরোনাম ও লিংকের জন্য CSS নিয়ম যোগ করুন। ফাঁকা জায়গা ও রং বদলান, তারপর সব লেখা সহজে পড়া যায় কি না দেখুন।',
      Hindi: 'अपने HTML पेज में body, शीर्षकों और लिंक के लिए एक CSS नियम जोड़ें। स्पेसिंग और रंग बदलें, फिर जांचें कि सभी पाठ पढ़ने में आसान रहे।',
      Kannada: 'ನಿಮ್ಮ HTML ಪುಟವನ್ನು ತೆಗೆದುಕೊಂಡು body, ಶೀರ್ಷಿಕೆಗಳು ಮತ್ತು ಲಿಂಕ್‌ಗಳಿಗಾಗಿ CSS ನಿಯಮವನ್ನು ಸೇರಿಸಿ. ಅಂತರ ಮತ್ತು ಬಣ್ಣಗಳನ್ನು ಬದಲಾಯಿಸಿ, ನಂತರ ಎಲ್ಲಾ ಪಠ್ಯವು ಓದಲು ಸುಲಭವಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
    },
    check: {
      English: 'Which CSS change made the page easier to read, and why?',
      Bengali: 'কোন CSS পরিবর্তনে পেজটি পড়তে সহজ হয়েছে, এবং কেন?',
      Hindi: 'किस CSS बदलाव ने पेज को पढ़ना आसान बना दिया, और क्यों?',
      Kannada: 'ಯಾವ CSS ಬದಲಾವಣೆಯು ಪುಟವನ್ನು ಓದಲು ಸುಲಭಗೊಳಿಸಿತು, ಮತ್ತು ಏಕೆ?',
    },
    quiz: {
      question: {
        English: 'Which CSS property changes the space inside an element’s border?',
        Bengali: 'কোন CSS বৈশিষ্ট্য উপাদানের বর্ডারের ভেতরের ফাঁকা জায়গা বদলায়?',
        Hindi: 'कौन सी CSS प्रॉपर्टी किसी तत्व के बॉर्डर के अंदर की जगह (स्पेस) को बदलती है?',
        Kannada: 'ಯಾವ CSS ಗುಣಲಕ್ಷಣವು ಅಂಶದ ಗಡಿಯ (ಬಾರ್ಡರ್) ಒಳಗಿನ ಜಾಗವನ್ನು ಬದಲಾಯಿಸುತ್ತದೆ?',
      },
      options: [
        { value: 'padding', label: { English: 'padding', Bengali: 'padding', Hindi: 'padding', Kannada: 'padding' } },
        { value: 'margin', label: { English: 'margin', Bengali: 'margin', Hindi: 'margin', Kannada: 'margin' } },
        { value: 'color', label: { English: 'color', Bengali: 'color', Hindi: 'color', Kannada: 'color' } },
      ],
      answer: 'padding',
      explanation: {
        English: 'Padding is the space between an element’s content and its border.',
        Bengali: 'Padding হলো উপাদানের কনটেন্ট ও বর্ডারের মাঝের ফাঁকা জায়গা।',
        Hindi: 'Padding किसी तत्व की सामग्री और उसके बॉर्डर के बीच की जगह होती है।',
        Kannada: 'Padding ಎಂಬುದು ಅಂಶದ ವಿಷಯ ಮತ್ತು ಅದರ ಗಡಿಯ ನಡುವಿನ ಜಾಗವಾಗಿದೆ.',
      },
    },
  },
  {
    skillSlug: 'javascript',
    category: 'Programming',
    level: 'starter',
    title: {
      English: 'Add a small interaction',
      Bengali: 'ছোট একটি ইন্টারঅ্যাকশন যোগ করুন',
      Hindi: 'एक छोटा इंटरैक्शन जोड़ें',
      Kannada: 'ಸಣ್ಣ ಸಂವಾದಾತ್ಮಕತೆಯನ್ನು ಸೇರಿಸಿ',
    },
    explanation: {
      English: 'JavaScript lets a page respond to actions. A button can listen for a click and then update a message. Start with one clear action and give feedback that users can see.',
      Bengali: 'JavaScript ব্যবহারকারীর কাজের প্রতি পেজকে সাড়া দিতে সাহায্য করে। একটি বাটন ক্লিক শুনে বার্তা বদলাতে পারে। একটি সহজ কাজ দিয়ে শুরু করুন এবং ব্যবহারকারী যেন পরিবর্তনটি দেখতে পান।',
      Hindi: 'JavaScript किसी पेज को क्रियाओं पर प्रतिक्रिया देने की अनुमति देता है। एक बटन क्लिक सुन सकता है और फिर एक संदेश अपडेट कर सकता है। एक स्पष्ट क्रिया के साथ शुरू करें और ऐसा फीडबैक दें जिसे उपयोगकर्ता देख सकें।',
      Kannada: 'JavaScript ಪುಟವು ಬಳಕೆದಾರರ ಕ್ರಿಯೆಗಳಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಲು ಅನುಮತಿಸುತ್ತದೆ. ಒಂದು ಬಟನ್ ಕ್ಲಿಕ್ ಅನ್ನು ಆಲಿಸಬಹುದು ಮತ್ತು ಸಂದೇಶವನ್ನು ನವೀಕರಿಸಬಹುದು. ಒಂದು ಸ್ಪಷ್ಟ ಕ್ರಿಯೆಯೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಬಳಕೆದಾರರು ನೋಡಬಹುದಾದ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ನೀಡಿ.',
    },
    activity: {
      English: 'Plan a button that changes a short message when clicked. Write down the starting message, the action, and the message the user should see afterward.',
      Bengali: 'ক্লিক করলে ছোট বার্তা বদলায় এমন একটি বাটনের পরিকল্পনা করুন। শুরুর বার্তা, ব্যবহারকারীর কাজ এবং পরে দেখা যাবে এমন বার্তাটি লিখে রাখুন।',
      Hindi: 'एक ऐसे बटन की योजना बनाएं जो क्लिक करने पर एक छोटा संदेश बदल दे। प्रारंभिक संदेश, क्रिया और बाद में दिखने वाला संदेश लिख लें।',
      Kannada: 'ಕ್ಲಿಕ್ ಮಾಡಿದಾಗ ಸಣ್ಣ ಸಂದೇಶವನ್ನು ಬದಲಾಯಿಸುವ ಬಟನ್ ಅನ್ನು ಯೋಜಿಸಿ. ಪ್ರಾರಂಭಿಕ ಸಂದೇಶ, ಕ್ರಿಯೆ ಮತ್ತು ಬಳಕೆದಾರರು ನಂತರ ನೋಡಬೇಕಾದ ಸಂದೇಶವನ್ನು ಬರೆದಿಡಿ.',
    },
    check: {
      English: 'What feedback tells the user that their action worked?',
      Bengali: 'ব্যবহারকারীর কাজ সফল হয়েছে—এটি কোন প্রতিক্রিয়া দেখে বোঝা যাবে?',
      Hindi: 'उपयोगकर्ता को कौन सा फीडबैक बताता है कि उनकी क्रिया सफल रही?',
      Kannada: 'ಬಳಕೆದಾರರಿಗೆ ಅವರ ಕ್ರಿಯೆ ಕೆಲಸ ಮಾಡಿದೆ ಎಂದು ಯಾವ ಪ್ರತಿಕ್ರಿಯೆ ತಿಳಿಸುತ್ತದೆ?',
    },
    quiz: {
      question: {
        English: 'Which event commonly runs code after a user presses a button?',
        Bengali: 'ব্যবহারকারী বাটন চাপার পর কোন ইভেন্টে সাধারণত কোড চলে?',
        Hindi: 'उपयोगकर्ता द्वारा बटन दबाने के बाद आमतौर पर कौन सा इवेंट कोड चलाता है?',
        Kannada: 'ಬಳಕೆದಾರರು ಬಟನ್ ಒತ್ತಿದ ನಂತರ ಸಾಮಾನ್ಯವಾಗಿ ಯಾವ ಇವೆಂಟ್ ಕೋಡ್ ಅನ್ನು ಚಲಾಯಿಸುತ್ತದೆ?',
      },
      options: [
        { value: 'click', label: { English: 'click', Bengali: 'click', Hindi: 'click', Kannada: 'click' } },
        { value: 'paint', label: { English: 'paint', Bengali: 'paint', Hindi: 'paint', Kannada: 'paint' } },
        { value: 'color', label: { English: 'color', Bengali: 'color', Hindi: 'color', Kannada: 'color' } },
      ],
      answer: 'click',
      explanation: {
        English: 'A click event lets a button respond to a user’s action.',
        Bengali: 'click ইভেন্ট ব্যবহারকারীর কাজের উত্তরে বাটনকে সাড়া দিতে দেয়।',
        Hindi: 'click इवेंट किसी बटन को उपयोगकर्ता की क्रिया का उत्तर देने की अनुमति देता है।',
        Kannada: 'click ಇವೆಂಟ್ ಬಳಕೆದಾರರ ಕ್ರಿಯೆಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಲು ಬಟನ್‌ಗೆ ಅನುಮತಿಸುತ್ತದೆ.',
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
