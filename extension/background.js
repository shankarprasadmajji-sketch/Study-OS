/**
 * StudyOS Focus Mode — Background Service Worker (Manifest V3)
 * Enforces distraction website blocking via chrome.declarativeNetRequest and chrome.storage.local.
 */

const DEFAULT_BLOCKLIST = [
  { id: 'bl-1', domain: 'youtube.com', label: 'YouTube', category: 'video', enabled: true, isDefault: true },
  { id: 'bl-2', domain: 'instagram.com', label: 'Instagram', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-3', domain: 'facebook.com', label: 'Facebook', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-4', domain: 'reddit.com', label: 'Reddit', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-5', domain: 'x.com', label: 'X (formerly Twitter)', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-6', domain: 'twitter.com', label: 'Twitter', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-7', domain: 'netflix.com', label: 'Netflix', category: 'streaming', enabled: true, isDefault: true },
  { id: 'bl-8', domain: 'tiktok.com', label: 'TikTok', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-9', domain: 'twitch.tv', label: 'Twitch', category: 'streaming', enabled: true, isDefault: true },
  { id: 'bl-10', domain: 'discord.com', label: 'Discord', category: 'social', enabled: true, isDefault: true },
];

const DEFAULT_SETTINGS = {
  // 'keep_blocking' prevents students from bypassing blocking by simply hitting pause
  pauseBehavior: 'keep_blocking', // 'keep_blocking' | 'pause_blocking'
  // 'keep_until_end' prevents impulse tab opening when timer hits 0 before review
  completeBehavior: 'keep_until_end', // 'keep_until_end' | 'auto_release'
};

const PROTECTED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'studyos.local',
  'accounts.google.com',
  'apis.google.com',
];

// Initialize storage on install or upgrade
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[StudyOS Extension] Installed / Updated.');
  const stored = await chrome.storage.local.get(['blocklist', 'settings', 'isFocusActive', 'logs']);

  if (!stored.blocklist) {
    await chrome.storage.local.set({ blocklist: DEFAULT_BLOCKLIST });
  }
  if (!stored.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  if (typeof stored.isFocusActive === 'undefined') {
    await chrome.storage.local.set({
      isFocusActive: false,
      isPaused: false,
      sessionStartTime: null,
      sessionEndTime: null,
      topicTitle: '',
    });
  }
  if (!stored.logs) {
    await chrome.storage.local.set({ logs: [] });
  }

  // Restore rules if session was active before restart/update
  await restoreRulesIfNeeded();
});

// Restore rules when browser starts or service worker wakes up
chrome.runtime.onStartup.addListener(async () => {
  console.log('[StudyOS Extension] Browser started. Checking focus session state...');
  await restoreRulesIfNeeded();
});

// Alarm for periodic session checks
chrome.alarms.create('studyos_session_monitor', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'studyos_session_monitor') {
    const data = await chrome.storage.local.get(['isFocusActive', 'isPaused', 'sessionEndTime', 'settings']);
    if (data.isFocusActive && !data.isPaused && data.sessionEndTime) {
      if (Date.now() >= data.sessionEndTime && data.settings?.completeBehavior === 'auto_release') {
        console.log('[StudyOS Extension] Focus session time elapsed. Auto-releasing rules per policy.');
        await endFocusSession('auto_complete');
      }
    }
  }
});

/**
 * Normalizes a raw input string into a standard domain name
 */
function normalizeDomain(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim().toLowerCase();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
  clean = clean.split('/')[0];
  clean = clean.split('?')[0];
  clean = clean.split('#')[0];
  clean = clean.split(':')[0]; // strip port
  return clean;
}

/**
 * Validates domain structure and prevents blocking protected local services
 */
function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const clean = normalizeDomain(domain);
  if (!clean || clean.length < 3 || clean.length > 253) return false;

  // Prevent blocking localhost or critical app origins
  if (PROTECTED_DOMAINS.includes(clean)) return false;

  // Standard domain name regex
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;
  return domainRegex.test(clean);
}

/**
 * Log session event to storage for troubleshooting
 */
async function appendLog(event, details = {}) {
  try {
    const { logs = [] } = await chrome.storage.local.get('logs');
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      event,
      details,
    };
    const updated = [entry, ...logs].slice(0, 50); // Keep last 50 events
    await chrome.storage.local.set({ logs: updated });
  } catch (err) {
    console.error('[StudyOS Extension] Failed to append log:', err);
  }
}

/**
 * Applies declarativeNetRequest dynamic redirect rules for enabled domains
 */
async function applyBlockingRules(domains) {
  const cleanDomains = domains
    .map(normalizeDomain)
    .filter((d) => d && isValidDomain(d));

  if (cleanDomains.length === 0) {
    console.warn('[StudyOS Extension] No valid domains to block.');
    await clearBlockingRules();
    return 0;
  }

  // Remove all existing dynamic rules first
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  // Main frame navigation redirect rules (takes student to blocked.html)
  const redirectRules = cleanDomains.map((domain, index) => {
    return {
      id: 1000 + index,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          extensionPath: `/blocked.html?domain=${encodeURIComponent(domain)}`,
        },
      },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ['main_frame'],
      },
    };
  });

  // Sub-resource blocking rules (blocks background requests / media on blocked domains)
  const blockSubresourceRules = cleanDomains.map((domain, index) => {
    return {
      id: 2000 + index,
      priority: 1,
      action: {
        type: 'block',
      },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ['sub_frame', 'xmlhttprequest', 'media', 'websocket'],
      },
    };
  });

  const allRules = [...redirectRules, ...blockSubresourceRules];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: allRules,
  });

  console.log(`[StudyOS Extension] Applied ${allRules.length} dynamic blocking rules for ${cleanDomains.length} domains.`);

  // Redirect currently opened tabs on blocked domains
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url) {
        try {
          const tabUrl = new URL(tab.url);
          const tabHost = tabUrl.hostname.toLowerCase().replace(/^www\./, '');
          const isBlocked = cleanDomains.some(
            (bd) => tabHost === bd || tabHost.endsWith(`.${bd}`)
          );
          if (isBlocked && tab.id) {
            const redirectUrl = chrome.runtime.getURL(
              `blocked.html?domain=${encodeURIComponent(tabHost)}`
            );
            chrome.tabs.update(tab.id, { url: redirectUrl }).catch(() => {});
          }
        } catch {
          // ignore invalid URLs (e.g. chrome://)
        }
      }
    }
  } catch (err) {
    console.warn('[StudyOS Extension] Could not inspect active tabs:', err);
  }

  return cleanDomains.length;
}

/**
 * Clears all dynamic rules
 */
async function clearBlockingRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  if (removeRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: [],
    });
    console.log(`[StudyOS Extension] Cleared ${removeRuleIds.length} dynamic blocking rules.`);
  }
}

/**
 * Restores rules after service worker restart if focus is still active
 */
async function restoreRulesIfNeeded() {
  try {
    const data = await chrome.storage.local.get([
      'isFocusActive',
      'isPaused',
      'settings',
      'blocklist',
    ]);
    const settings = data.settings || DEFAULT_SETTINGS;
    const blocklist = data.blocklist || DEFAULT_BLOCKLIST;

    if (data.isFocusActive) {
      const shouldBlock = !data.isPaused || settings.pauseBehavior === 'keep_blocking';
      if (shouldBlock) {
        const enabledDomains = blocklist.filter((b) => b.enabled).map((b) => b.domain);
        await applyBlockingRules(enabledDomains);
        console.log('[StudyOS Extension] Successfully restored active focus blocking rules.');
      } else {
        await clearBlockingRules();
      }
    } else {
      await clearBlockingRules();
    }
  } catch (err) {
    console.error('[StudyOS Extension] Error checking or restoring rules:', err);
  }
}

/**
 * Starts a focus session
 */
async function startFocusSession(payload = {}) {
  const { durationMinutes = 25, topicTitle = 'Syllabus Focus Session' } = payload;
  const data = await chrome.storage.local.get(['blocklist', 'settings']);
  const blocklist = data.blocklist || DEFAULT_BLOCKLIST;
  const settings = data.settings || DEFAULT_SETTINGS;

  const enabledDomains = blocklist.filter((b) => b.enabled).map((b) => b.domain);
  const blockedCount = await applyBlockingRules(enabledDomains);

  const startTime = Date.now();
  const endTime = startTime + durationMinutes * 60 * 1000;

  await chrome.storage.local.set({
    isFocusActive: true,
    isPaused: false,
    sessionStartTime: startTime,
    sessionEndTime: endTime,
    durationMinutes,
    topicTitle,
    activeBlockedCount: blockedCount,
  });

  await appendLog('SESSION_START', { durationMinutes, topicTitle, blockedCount });

  return {
    success: true,
    isFocusActive: true,
    isPaused: false,
    blockedCount,
    sessionStartTime: startTime,
    sessionEndTime: endTime,
  };
}

/**
 * Pauses a focus session (applies configured pause anti-bypass policy)
 */
async function pauseFocusSession() {
  const data = await chrome.storage.local.get(['isFocusActive', 'settings', 'blocklist']);
  if (!data.isFocusActive) {
    return { success: false, error: 'No active focus session to pause.' };
  }

  const settings = data.settings || DEFAULT_SETTINGS;
  const keepBlocking = settings.pauseBehavior === 'keep_blocking';

  if (!keepBlocking) {
    await clearBlockingRules();
  }

  await chrome.storage.local.set({ isPaused: true });
  await appendLog('SESSION_PAUSE', { keepBlocking });

  return {
    success: true,
    isFocusActive: true,
    isPaused: true,
    rulesActive: keepBlocking,
  };
}

/**
 * Resumes a paused focus session
 */
async function resumeFocusSession() {
  const data = await chrome.storage.local.get(['isFocusActive', 'settings', 'blocklist']);
  if (!data.isFocusActive) {
    return { success: false, error: 'No active focus session to resume.' };
  }

  const blocklist = data.blocklist || DEFAULT_BLOCKLIST;
  const enabledDomains = blocklist.filter((b) => b.enabled).map((b) => b.domain);
  const blockedCount = await applyBlockingRules(enabledDomains);

  await chrome.storage.local.set({ isPaused: false, activeBlockedCount: blockedCount });
  await appendLog('SESSION_RESUME', { blockedCount });

  return {
    success: true,
    isFocusActive: true,
    isPaused: false,
    blockedCount,
  };
}

/**
 * Ends a focus session and restores normal browsing
 */
async function endFocusSession(reason = 'user_ended') {
  await clearBlockingRules();

  await chrome.storage.local.set({
    isFocusActive: false,
    isPaused: false,
    sessionStartTime: null,
    sessionEndTime: null,
    topicTitle: '',
    activeBlockedCount: 0,
  });

  await appendLog('SESSION_END', { reason });

  return {
    success: true,
    isFocusActive: false,
    isPaused: false,
    rulesActive: false,
  };
}

/**
 * Dispatches and routes messages from both internal (popup, content script)
 * and external (direct StudyOS web app origin) senders.
 */
async function handleMessage(message, sender) {
  const { command, payload } = message || {};

  switch (command) {
    case 'PING': {
      const data = await chrome.storage.local.get([
        'isFocusActive',
        'isPaused',
        'activeBlockedCount',
        'settings',
        'blocklist',
        'topicTitle',
        'sessionEndTime',
      ]);
      const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
      return {
        success: true,
        version: '1.0.0',
        installed: true,
        isFocusActive: !!data.isFocusActive,
        isPaused: !!data.isPaused,
        blockedCount: data.activeBlockedCount || 0,
        activeRuleCount: currentRules.length,
        topicTitle: data.topicTitle || '',
        sessionEndTime: data.sessionEndTime || null,
        settings: data.settings || DEFAULT_SETTINGS,
      };
    }

    case 'GET_STATUS': {
      const data = await chrome.storage.local.get(null);
      const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
      return {
        success: true,
        state: {
          ...data,
          activeRuleCount: currentRules.length,
        },
      };
    }

    case 'START_FOCUS':
      return await startFocusSession(payload);

    case 'PAUSE_FOCUS':
      return await pauseFocusSession();

    case 'RESUME_FOCUS':
      return await resumeFocusSession();

    case 'END_FOCUS':
      return await endFocusSession(payload?.reason || 'user_ended');

    case 'GET_BLOCKLIST': {
      const data = await chrome.storage.local.get(['blocklist', 'settings']);
      return {
        success: true,
        blocklist: data.blocklist || DEFAULT_BLOCKLIST,
        settings: data.settings || DEFAULT_SETTINGS,
      };
    }

    case 'UPDATE_BLOCKLIST': {
      const { blocklist } = payload || {};
      if (!Array.isArray(blocklist)) {
        return { success: false, error: 'blocklist must be an array' };
      }

      // Validate each item
      const validated = blocklist
        .map((item, idx) => ({
          id: item.id || `bl-custom-${idx}-${Date.now()}`,
          domain: normalizeDomain(item.domain),
          label: item.label || normalizeDomain(item.domain),
          category: item.category || 'custom',
          enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
          isDefault: !!item.isDefault,
        }))
        .filter((item) => isValidDomain(item.domain));

      await chrome.storage.local.set({ blocklist: validated });

      // If session is active and currently blocking, re-apply rules immediately
      const session = await chrome.storage.local.get(['isFocusActive', 'isPaused', 'settings']);
      if (session.isFocusActive && (!session.isPaused || session.settings?.pauseBehavior === 'keep_blocking')) {
        const enabled = validated.filter((b) => b.enabled).map((b) => b.domain);
        const count = await applyBlockingRules(enabled);
        await chrome.storage.local.set({ activeBlockedCount: count });
      }

      await appendLog('BLOCKLIST_UPDATED', { count: validated.length });
      return { success: true, blocklist: validated };
    }

    case 'UPDATE_SETTINGS': {
      const { settings } = payload || {};
      const current = (await chrome.storage.local.get('settings')).settings || DEFAULT_SETTINGS;
      const updated = {
        ...current,
        ...(settings?.pauseBehavior ? { pauseBehavior: settings.pauseBehavior } : {}),
        ...(settings?.completeBehavior ? { completeBehavior: settings.completeBehavior } : {}),
      };
      await chrome.storage.local.set({ settings: updated });
      await appendLog('SETTINGS_UPDATED', updated);
      return { success: true, settings: updated };
    }

    case 'GET_LOGS': {
      const { logs = [] } = await chrome.storage.local.get('logs');
      return { success: true, logs };
    }

    default:
      return { success: false, error: `Unknown command: ${command}` };
  }
}

// Internal messaging from popup & content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((res) => sendResponse(res))
    .catch((err) => sendResponse({ success: false, error: err.message }));
  return true; // asynchronous reply
});

// External messaging directly from authorized StudyOS website origins
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const origin = sender?.origin || sender?.url || '';
  const allowed = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'https://studyos.local',
  ];

  const isAllowed = allowed.some((allowedOrigin) => origin.startsWith(allowedOrigin));
  if (!isAllowed) {
    console.warn(`[StudyOS Extension] Rejected unauthorized external origin: ${origin}`);
    sendResponse({ success: false, error: `Unauthorized origin: ${origin}` });
    return true;
  }

  handleMessage(message, sender)
    .then((res) => sendResponse(res))
    .catch((err) => sendResponse({ success: false, error: err.message }));
  return true;
});
