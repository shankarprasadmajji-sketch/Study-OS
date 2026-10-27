/**
 * StudyOS Blocked Page Logic
 */

const STUDY_QUOTES = [
  {
    quote: 'Deep work is the ability to focus without distraction on a cognitively demanding task.',
    author: 'Cal Newport, Deep Work',
  },
  {
    quote: 'It is not that I have so much genius, but rather that I stay with problems longer.',
    author: 'Albert Einstein',
  },
  {
    quote: 'Concentration comes out of a combination of confidence and hunger.',
    author: 'Arnold Palmer',
  },
  {
    quote: 'Small disciplines repeated with consistency every day lead to great achievements.',
    author: 'John C. Maxwell',
  },
];

document.addEventListener('DOMContentLoaded', async () => {
  // Extract blocked domain from URL query params
  const params = new URLSearchParams(window.location.search);
  const domainParam = params.get('domain');

  const domainNameEl = document.getElementById('blockedDomainName');
  if (domainParam && domainNameEl) {
    domainNameEl.textContent = domainParam;
  }

  // Pick random quote
  const randomQ = STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)];
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  if (quoteText && quoteAuthor) {
    quoteText.textContent = `"${randomQ.quote}"`;
    quoteAuthor.textContent = `— ${randomQ.author}`;
  }

  // Load active session topic from chrome.storage
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(['topicTitle', 'isFocusActive', 'isPaused']);
      if (data.isFocusActive && data.topicTitle) {
        const sessionBox = document.getElementById('sessionBox');
        const sessionTopic = document.getElementById('sessionTopic');
        const sessionStatus = document.getElementById('sessionStatus');

        if (sessionBox && sessionTopic && sessionStatus) {
          sessionTopic.textContent = data.topicTitle;
          sessionStatus.textContent = data.isPaused ? 'Paused (Enforced)' : 'Active Focus';
          sessionBox.style.display = 'flex';
        }
      }
    }
  } catch (err) {
    console.warn('[StudyOS Blocked Page] Could not read session state:', err);
  }

  // Wire Close Tab button
  const closeBtn = document.getElementById('closeTabBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.close();
    });
  }
});
