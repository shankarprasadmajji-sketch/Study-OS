document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('statusBadge');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const blockedCount = document.getElementById('blockedCount');
  const rulesCount = document.getElementById('rulesCount');

  try {
    // Send PING command to background service worker
    chrome.runtime.sendMessage({ command: 'PING' }, (res) => {
      if (chrome.runtime.lastError || !res) {
        statusBadge.textContent = 'Disconnected';
        statusTitle.textContent = 'Extension Error';
        statusDesc.textContent = 'Background service worker unavailable.';
        return;
      }

      if (res.isFocusActive) {
        statusBadge.textContent = res.isPaused ? 'Paused' : 'Active';
        statusBadge.classList.add('active');
        statusTitle.textContent = res.isPaused ? 'Focus Session Paused' : 'Blocking Active';
        statusDesc.textContent = res.topicTitle
          ? `Protecting focus on: ${res.topicTitle}`
          : 'Blocking distracting websites until session ends.';
      } else {
        statusBadge.textContent = 'Idle';
        statusBadge.classList.remove('active');
        statusTitle.textContent = 'Focus Mode Idle';
        statusDesc.textContent = 'Start a session in StudyOS to activate website blocking.';
      }

      // Update counts
      chrome.storage.local.get(['blocklist'], (data) => {
        const list = data.blocklist || [];
        const enabled = list.filter((b) => b.enabled).length;
        if (blockedCount) blockedCount.textContent = enabled;
      });

      if (rulesCount) rulesCount.textContent = res.activeRuleCount || 0;
    });
  } catch (err) {
    console.error('Failed to query background status:', err);
  }
});
