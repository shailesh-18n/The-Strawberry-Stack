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

  function setStatus(message) {
    statusElement.textContent = message;
    const online = navigator.onLine;
    indicatorElement.textContent = online ? '●' : '●';
    indicatorElement.classList.toggle('is-online', online);
    indicatorElement.classList.toggle('is-offline', !online);
    indicatorElement.setAttribute('aria-label', online ? 'Online' : 'Offline');
  }

  function updateProgressCount() {
    const language = languageElement.value;
    const completed = progress.completedSkills.length;
    const pending = progress.pendingSkills.length;
    progressElement.textContent = language === 'Bengali'
      ? `${completed}টি পাঠ সম্পন্ন${pending ? `, ${pending}টি সিঙ্কের অপেক্ষায়` : ''}।`
      : `${completed} lesson${completed === 1 ? '' : 's'} completed${pending ? `, ${pending} queued to sync` : ''}.`;
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
    document.documentElement.lang = language === 'Bengali' ? 'bn' : 'en';
    for (const lesson of lessons) {
      const card = document.createElement('article');
      const complete = progress.completedSkills.includes(lesson.skillSlug);
      card.className = `lesson${complete ? ' lesson-complete' : ''}`;

      const title = document.createElement('h2');
      title.textContent = lesson.title[language];
      card.append(title);
      addParagraph(card, `${lesson.category} · ${lesson.level}`);
      addParagraph(card, lesson.explanation[language]);

      const activityTitle = document.createElement('h3');
      activityTitle.textContent = language === 'Bengali' ? 'অনুশীলন' : 'Try it';
      card.append(activityTitle);
      addParagraph(card, lesson.activity[language]);

      const quiz = document.createElement('fieldset');
      quiz.className = 'offline-quiz';
      const question = document.createElement('legend');
      question.textContent = lesson.quiz.question[language];
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
        text.textContent = option.label[language];
        label.append(input, text);
        quiz.append(label);
      }
      const checkButton = document.createElement('button');
      checkButton.type = 'button';
      checkButton.textContent = language === 'Bengali' ? 'উত্তর যাচাই করুন' : 'Check answer';
      checkButton.addEventListener('click', () => {
        const selected = quiz.querySelector(`input[name="quiz-${lesson.skillSlug}"]:checked`);
        if (!selected) {
          feedback.textContent = language === 'Bengali' ? 'একটি উত্তর বেছে নিন।' : 'Choose an answer first.';
          return;
        }
        const correct = selected.value === lesson.quiz.answer;
        feedback.textContent = correct
          ? `${language === 'Bengali' ? 'সঠিক।' : 'Correct.'} ${lesson.quiz.explanation[language]}`
          : (language === 'Bengali' ? 'আবার চেষ্টা করুন।' : 'Try again.');
        feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
      });
      quiz.append(checkButton, feedback);
      card.append(quiz);

      const reflectionTitle = document.createElement('h3');
      reflectionTitle.textContent = language === 'Bengali' ? 'নিজেকে যাচাই করুন' : 'Reflect';
      card.append(reflectionTitle);
      addParagraph(card, lesson.check[language]);
      const state = document.createElement('p');
      state.className = 'completion-state';
      state.textContent = complete
        ? (language === 'Bengali' ? 'সম্পন্ন' : 'Completed on this device')
        : (language === 'Bengali' ? 'এখনও সম্পন্ন হয়নি' : 'Not completed yet');
      card.append(state);

      if (!complete) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = language === 'Bengali' ? 'পাঠ সম্পন্ন হয়েছে' : 'Mark lesson complete';
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
