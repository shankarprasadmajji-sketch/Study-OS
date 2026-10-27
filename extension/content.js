/**
 * StudyOS Focus Mode — Content Script Bridge
 * Injected into StudyOS web app (localhost:5173, etc.) to establish secure two-way
 * communication between the React frontend and the extension background worker.
 */

// Mark DOM so StudyOS frontend can immediately detect the extension on page load
document.documentElement.setAttribute('data-studyos-extension-installed', 'true');
window.dispatchEvent(new CustomEvent('studyos-extension-ready', { detail: { version: '1.0.0' } }));

// Listen for messages from StudyOS React application via window.postMessage
window.addEventListener('message', async (event) => {
  // Ensure message originates from the same page window
  if (event.source !== window || !event.data || event.data.source !== 'STUDYOS_WEB_APP') {
    return;
  }

  const { requestId, command, payload } = event.data;
  if (!command) return;

  try {
    // Relay command to background service worker
    chrome.runtime.sendMessage({ command, payload }, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        window.postMessage(
          {
            source: 'STUDYOS_EXTENSION_RESPONSE',
            requestId,
            response: { success: false, error: lastError.message },
          },
          '*'
        );
        return;
      }

      window.postMessage(
        {
          source: 'STUDYOS_EXTENSION_RESPONSE',
          requestId,
          response: response || { success: true },
        },
        '*'
      );
    });
  } catch (err) {
    window.postMessage(
      {
        source: 'STUDYOS_EXTENSION_RESPONSE',
        requestId,
        response: { success: false, error: err.message },
      },
      '*'
    );
  }
});
