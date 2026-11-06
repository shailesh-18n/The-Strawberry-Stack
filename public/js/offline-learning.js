(() => {
  const databaseName = 'vidyachain-offline-learning';
  const databaseVersion = 1;
  const stateKey = 'progress';
  const lessonsElement = document.querySelector('#lessons');
  const statusElement = document.querySelector('#connection-label');
  const indicatorElement = document.querySelector('#connection-indicator');
  const progressElement = document.querySelector('#progress-count');
  const languageElement = document.querySelector('#language');
  const syncButton = document.querySelector('#sync-progress');
  let lessons = [];
  let progress = {
    completedSkills: [],
    pendingSkills: [],
    baseCompletedSkills: [],
  };
  let syncing = false;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, databaseVersion);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('state', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readProgress() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('state', 'readonly');
      const request = transaction.objectStore('state').get(stateKey);
      request.onsuccess = () => {
        const stored = request.result;
        if (stored) {
          resolve(stored);
          return;
        }
        let legacyCompletions = [];
        try {
          const legacy = JSON.parse(localStorage.getItem('vidyachain-offline-learning-v1') || '[]');
          if (Array.isArray(legacy)) legacyCompletions = legacy.filter((slug) => typeof slug === 'string');
        } catch {
          legacyCompletions = [];
        }
        resolve({
          id: stateKey,
          completedSkills: legacyCompletions,
          pendingSkills: legacyCompletions,
          baseCompletedSkills: [],
        });
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => database.close();
    });
  }

  async function saveProgress() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('state', 'readwrite');
      transaction.objectStore('state').put({ id: stateKey, ...progress });
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error('Offline progress could not be saved.'));
      };
    });
  }

  const UI_STRINGS = {
    English: {
      lang: 'en',
      progress: (c, p) => `${c} lesson${c === 1 ? '' : 's'} completed${p ? `, ${p} queued to sync` : ''}.`,
      activity: 'Try it',
      checkAnswer: 'Check answer',
      chooseFirst: 'Choose an answer first.',
      correct: 'Correct.',
      tryAgain: 'Try again.',
      reflect: 'Reflect',
      completed: 'Completed on this device',
      notCompleted: 'Not completed yet',
      markComplete: 'Mark lesson complete',
    },
    Bengali: {
      lang: 'bn',
      progress: (c, p) => `${c}টি পাঠ সম্পন্ন${p ? `, ${p}টি সিঙ্কের অপেক্ষায়` : ''}।`,
      activity: 'অনুশীলন',
      checkAnswer: 'উত্তর যাচাই করুন',
      chooseFirst: 'একটি উত্তর বেছে নিন।',
      correct: 'সঠিক।',
      tryAgain: 'আবার চেষ্টা করুন।',
      reflect: 'নিজেকে যাচাই করুন',
      completed: 'সম্পন্ন',
      notCompleted: 'এখনও সম্পন্ন হয়নি',
      markComplete: 'পাঠ সম্পন্ন হয়েছে',
    },
    Hindi: {
      lang: 'hi',
      progress: (c, p) => `${c} पाठ पूरे हुए${p ? `, ${p} सिंक के लिए कतार में` : ''}।`,
      activity: 'अभ्यास',
      checkAnswer: 'उत्तर जांचें',
      chooseFirst: 'पहले एक उत्तर चुनें।',
      correct: 'सही उत्तर।',
      tryAgain: 'पुनः प्रयास करें।',
      reflect: 'विचार करें',
      completed: 'इस डिवाइस पर पूर्ण हुआ',
      notCompleted: 'अभी तक पूर्ण नहीं हुआ',
      markComplete: 'पाठ को पूर्ण चिह्नित करें',
    },
    Kannada: {
      lang: 'kn',
      progress: (c, p) => `${c} ಪಾಠಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ${p ? `, ${p} ಸಿಂಕ್ ಮಾಡಲು ಕಾಯುತ್ತಿವೆ` : ''}.`,
      activity: 'ಅಭ್ಯಾಸ',
      checkAnswer: 'ಉತ್ತರ ಪರಿಶೀಲಿಸಿ',
      chooseFirst: 'ಮೊದಲು ಒಂದು ಉತ್ತರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
      correct: 'ಸರಿ.',
      tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
      reflect: 'ಆತ್ಮಾವಲೋಕನ',
      completed: 'ಈ ಸಾಧನದಲ್ಲಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
      notCompleted: 'ಇನ್ನೂ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ',
      markComplete: 'ಪಾಠ ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    },
  };

  function getLabels(language) {
    return UI_STRINGS[language] || UI_STRINGS.English;
  }

  function setStatus(message) {
    statusElement.textContent = message;
    const online = navigator.onLine;
    indicatorElement.textContent = online ? '●' : '●';
    indicatorElement.classList.toggle('is-online', online);
    indicatorElement.classList.toggle('is-offline', !online);
    indicatorElement.setAttribute('aria-label', online ? 'Online' : 'Offline');
  }

  function updateProgressCount() {
    const labels = getLabels(languageElement.value);
    const completed = progress.completedSkills.length;
    const pending = progress.pendingSkills.length;
    progressElement.textContent = labels.progress(completed, pending);
  }

  function addParagraph(parent, text) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    parent.append(paragraph);
    return paragraph;
  }

  function render() {
    lessonsElement.replaceChildren();
    const language = languageElement.value;
    const labels = getLabels(language);
    document.documentElement.lang = labels.lang;
    for (const lesson of lessons) {
      const card = document.createElement('article');
      const complete = progress.completedSkills.includes(lesson.skillSlug);
      card.className = `lesson${complete ? ' lesson-complete' : ''}`;

      const title = document.createElement('h2');
      title.textContent = lesson.title[language] || lesson.title.English;
      card.append(title);
      addParagraph(card, `${lesson.category} · ${lesson.level}`);
      addParagraph(card, lesson.explanation[language] || lesson.explanation.English);

      const activityTitle = document.createElement('h3');
      activityTitle.textContent = labels.activity;
      card.append(activityTitle);
      addParagraph(card, lesson.activity[language] || lesson.activity.English);

      const quiz = document.createElement('fieldset');
      quiz.className = 'offline-quiz';
      const question = document.createElement('legend');
      question.textContent = lesson.quiz.question[language] || lesson.quiz.question.English;
      quiz.append(question);
      const feedback = document.createElement('p');
      feedback.className = 'quiz-feedback';
      feedback.setAttribute('aria-live', 'polite');
      for (const [index, option] of lesson.quiz.options.entries()) {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `quiz-${lesson.skillSlug}`;
        input.value = option.value;
        input.id = `quiz-${lesson.skillSlug}-${index}`;
        const text = document.createElement('span');
        text.textContent = option.label[language] || option.label.English;
        label.append(input, text);
        quiz.append(label);
      }
      const checkButton = document.createElement('button');
      checkButton.type = 'button';
      checkButton.textContent = labels.checkAnswer;
      checkButton.addEventListener('click', () => {
        const selected = quiz.querySelector(`input[name="quiz-${lesson.skillSlug}"]:checked`);
        if (!selected) {
          feedback.textContent = labels.chooseFirst;
          return;
        }
        const correct = selected.value === lesson.quiz.answer;
        const explanation = lesson.quiz.explanation[language] || lesson.quiz.explanation.English;
        feedback.textContent = correct
          ? `${labels.correct} ${explanation}`
          : labels.tryAgain;
        feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
      });
      quiz.append(checkButton, feedback);
      card.append(quiz);

      const reflectionTitle = document.createElement('h3');
      reflectionTitle.textContent = labels.reflect;
      card.append(reflectionTitle);
      addParagraph(card, lesson.check[language] || lesson.check.English);
      const state = document.createElement('p');
      state.className = 'completion-state';
      state.textContent = complete ? labels.completed : labels.notCompleted;
      card.append(state);

      if (!complete) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = labels.markComplete;
        button.addEventListener('click', async () => {
          progress.completedSkills = [...new Set([...progress.completedSkills, lesson.skillSlug])];
          progress.pendingSkills = [...new Set([...progress.pendingSkills, lesson.skillSlug])];
          try {
            await saveProgress();
            try {
              localStorage.removeItem('vidyachain-offline-learning-v1');
            } catch {
              setStatus('Lessons are ready; legacy progress could not be removed from local storage.');
            }
            render();
            updateProgressCount();
            setStatus(navigator.onLine
              ? 'Progress saved on this device and queued for account sync.'
              : 'Offline: progress saved on this device and queued for sync.');
            if (navigator.onLine) await syncProgress();
          } catch {
            setStatus('Could not save this completion to IndexedDB. Check device storage settings.');
          }
        });
        card.append(button);
      }
      lessonsElement.append(card);
    }
  }

  async function getProgressState() {
    const response = await fetch('/learning/progress/state', {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Sign in while online to sync progress with your account.');
    }
    return response.json();
  }

  async function syncProgress() {
    if (syncing || !progress.pendingSkills.length) return;
    if (!navigator.onLine) {
      setStatus('Offline: completed lesson updates are queued on this device.');
      return;
    }
    syncing = true;
    syncButton.disabled = true;
    try {
      const serverState = await getProgressState();
      const response = await fetch('/learning/progress/sync', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': serverState.csrfToken,
          accept: 'application/json',
        },
        body: JSON.stringify({
          completedSkills: progress.completedSkills,
          baseCompletedSkills: progress.baseCompletedSkills,
        }),
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json') ? await response.json() : {};
      if (!response.ok) throw new Error(result.error || 'Progress could not be synced.');

      progress.completedSkills = [...new Set(result.completedSkills || [])];
      progress.baseCompletedSkills = [...progress.completedSkills];
      progress.pendingSkills = progress.pendingSkills.filter((slug) => (
        !progress.completedSkills.includes(slug)
      ));
      await saveProgress();
      render();
      updateProgressCount();
      setStatus(result.conflicts?.length
        ? 'Progress synced. A completion conflict was merged; completed lessons are preserved.'
        : `Synced ${result.synced} new completed lesson${result.synced === 1 ? '' : 's'} to your account.`);
    } catch (error) {
      setStatus(`${error.message} Pending progress remains queued on this device.`);
    } finally {
      syncing = false;
      syncButton.disabled = false;
    }
  }

  async function loadLessons() {
    progress = await readProgress();
    const response = await fetch('/learning/offline-pack', {
      headers: { accept: 'application/json' },
      cache: 'no-cache',
    });
    if (!response.ok) throw new Error('Saved lessons could not be loaded.');
    const pack = await response.json();
    if (!Array.isArray(pack.lessons)) throw new Error('The saved lesson pack is invalid.');
    lessons = pack.lessons;
    const validSlugs = new Set(lessons.map((lesson) => lesson.skillSlug));
    for (const key of ['completedSkills', 'pendingSkills', 'baseCompletedSkills']) {
      progress[key] = [...new Set((progress[key] || []).filter((slug) => validSlugs.has(slug)))];
    }
    await saveProgress();
    render();
    updateProgressCount();
    setStatus(navigator.onLine
      ? 'Online: lessons are saved on this device for offline use.'
      : 'Offline: saved lessons and queued progress are available.');
    if (navigator.onLine) {
      try {
        const serverState = await getProgressState();
        progress.completedSkills = [...new Set([
          ...progress.completedSkills,
          ...(serverState.completedSkills || []),
        ])];
        progress.baseCompletedSkills = [...new Set(serverState.completedSkills || [])];
        await saveProgress();
        render();
        updateProgressCount();
        await syncProgress();
      } catch {
        setStatus(navigator.onLine
          ? 'Lessons are available offline; sign in online to sync saved progress.'
          : 'Offline: saved lessons and queued progress are available.');
      }
    }
  }

  languageElement.addEventListener('change', () => {
    render();
    updateProgressCount();
  });
  syncButton.addEventListener('click', syncProgress);
  window.addEventListener('online', syncProgress);
  window.addEventListener('offline', () => {
    setStatus('Offline: lessons are available and progress updates are queued locally.');
  });

  setStatus(navigator.onLine ? 'Online' : 'Offline');
  loadLessons().catch((error) => {
    setStatus(`${error.message} Connect once to download lessons for offline use.`);
  });
})();
