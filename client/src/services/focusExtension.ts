/**
 * StudyOS Focus Mode — Chrome Extension Integration Service
 * Communicates with the StudyOS Manifest V3 Chrome Extension via
 * window.postMessage bridge (content script) or direct chrome.runtime.sendMessage.
 */

export interface BlocklistItem {
  id: string;
  domain: string;
  label: string;
  category: 'social' | 'video' | 'streaming' | 'gaming' | 'custom';
  enabled: boolean;
  isDefault?: boolean;
}

export interface ExtensionSettings {
  pauseBehavior: 'keep_blocking' | 'pause_blocking';
  completeBehavior: 'keep_until_end' | 'auto_release';
}

export interface ExtensionStatus {
  isAvailable: boolean;
  isFocusActive: boolean;
  isPaused: boolean;
  blockedCount: number;
  activeRuleCount: number;
  topicTitle: string;
  settings: ExtensionSettings;
  version?: string;
  error?: string;
}

export const DEFAULT_BLOCKLIST: BlocklistItem[] = [
  { id: 'bl-1', domain: 'youtube.com', label: 'YouTube', category: 'video', enabled: true, isDefault: true },
  { id: 'bl-2', domain: 'instagram.com', label: 'Instagram', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-3', domain: 'facebook.com', label: 'Facebook', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-4', domain: 'reddit.com', label: 'Reddit', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-5', domain: 'x.com', label: 'X (Twitter)', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-6', domain: 'twitter.com', label: 'Twitter', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-7', domain: 'netflix.com', label: 'Netflix', category: 'streaming', enabled: true, isDefault: true },
  { id: 'bl-8', domain: 'tiktok.com', label: 'TikTok', category: 'social', enabled: true, isDefault: true },
  { id: 'bl-9', domain: 'twitch.tv', label: 'Twitch', category: 'streaming', enabled: true, isDefault: true },
  { id: 'bl-10', domain: 'discord.com', label: 'Discord', category: 'social', enabled: true, isDefault: true },
];

export const DEFAULT_SETTINGS: ExtensionSettings = {
  pauseBehavior: 'keep_blocking',
  completeBehavior: 'keep_until_end',
};

const PROTECTED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'studyos.local',
  'accounts.google.com',
  'apis.google.com',
];

/**
 * Normalizes user input into a clean hostname
 */
export function normalizeDomainInput(raw: string): string {
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
 * Validates domain input format and checks against protected local domains
 */
export function validateDomainInput(raw: string): {
  valid: boolean;
  error?: string;
  cleanDomain: string;
} {
  const cleanDomain = normalizeDomainInput(raw);
  if (!cleanDomain) {
    return { valid: false, error: 'Domain cannot be empty.', cleanDomain };
  }

  if (cleanDomain.length < 3 || cleanDomain.length > 253) {
    return { valid: false, error: 'Domain must be between 3 and 253 characters.', cleanDomain };
  }

  if (PROTECTED_DOMAINS.includes(cleanDomain)) {
    return {
      valid: false,
      error: `Cannot block essential or local service "${cleanDomain}".`,
      cleanDomain,
    };
  }

  const domainRegex =
    /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;
  if (!domainRegex.test(cleanDomain)) {
    return {
      valid: false,
      error: 'Please enter a valid hostname (e.g. youtube.com, reddit.com). Do not include paths or protocols.',
      cleanDomain,
    };
  }

  return { valid: true, cleanDomain };
}

/**
 * Core communication dispatcher to the Chrome extension
 */
export async function sendExtensionCommand<T = any>(
  command: string,
  payload?: any,
  timeoutMs = 2500
): Promise<T> {
  // Check if content script marked DOM
  const isInstalled =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-studyos-extension-installed') === 'true';

  // Strategy 1: window.postMessage bridge (Works automatically with content script on localhost)
  return new Promise<T>((resolve, reject) => {
    const requestId = `studyos-cmd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let timer: any = null;

    const listener = (event: MessageEvent) => {
      if (
        event.source !== window ||
        !event.data ||
        event.data.source !== 'STUDYOS_EXTENSION_RESPONSE' ||
        event.data.requestId !== requestId
      ) {
        return;
      }

      cleanup();
      const res = event.data.response;
      if (res && res.success === false) {
        reject(new Error(res.error || `Command ${command} failed`));
      } else {
        resolve(res as T);
      }
    };

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('message', listener);
    };

    timer = setTimeout(() => {
      cleanup();
      // Strategy 2: If direct extension ID is configured, try direct runtime messaging
      const extId =
        (typeof window !== 'undefined' && (window as any).__STUDYOS_EXTENSION_ID__) ||
        (import.meta as any)?.env?.VITE_STUDYOS_EXTENSION_ID ||
        null;

      const chromeRuntime = (window as any).chrome?.runtime;
      if (chromeRuntime && extId) {
        try {
          chromeRuntime.sendMessage(extId, { command, payload }, (res: any) => {
            if (chromeRuntime.lastError) {
              reject(new Error(chromeRuntime.lastError.message || 'Extension unavailable'));
            } else if (res && res.success === false) {
              reject(new Error(res.error || 'Command failed'));
            } else {
              resolve(res as T);
            }
          });
          return;
        } catch (err: any) {
          reject(err);
          return;
        }
      }

      reject(new Error('StudyOS Extension not detected or did not respond in time.'));
    }, timeoutMs);

    window.addEventListener('message', listener);

    window.postMessage(
      {
        source: 'STUDYOS_WEB_APP',
        requestId,
        command,
        payload,
      },
      '*'
    );
  });
}

/**
 * Checks if extension is installed and responsive
 */
export async function checkExtensionStatus(): Promise<ExtensionStatus> {
  try {
    const res = await sendExtensionCommand<{
      success: boolean;
      version: string;
      isFocusActive: boolean;
      isPaused: boolean;
      blockedCount: number;
      activeRuleCount: number;
      topicTitle: string;
      settings: ExtensionSettings;
    }>('PING', {}, 1800);

    return {
      isAvailable: true,
      isFocusActive: !!res.isFocusActive,
      isPaused: !!res.isPaused,
      blockedCount: res.blockedCount || 0,
      activeRuleCount: res.activeRuleCount || 0,
      topicTitle: res.topicTitle || '',
      settings: res.settings || DEFAULT_SETTINGS,
      version: res.version,
    };
  } catch {
    return {
      isAvailable: false,
      isFocusActive: false,
      isPaused: false,
      blockedCount: 0,
      activeRuleCount: 0,
      topicTitle: '',
      settings: DEFAULT_SETTINGS,
    };
  }
}

/**
 * Start distraction blocking focus session
 */
export async function startExtensionFocus(params: {
  durationMinutes: number;
  topicTitle: string;
}): Promise<{ success: boolean; blockedCount: number }> {
  const res = await sendExtensionCommand<{
    success: boolean;
    isFocusActive: boolean;
    blockedCount: number;
  }>('START_FOCUS', params);

  return {
    success: !!res.success,
    blockedCount: res.blockedCount || 0,
  };
}

/**
 * Pause focus session (applies configured pause anti-bypass policy)
 */
export async function pauseExtensionFocus(): Promise<{
  success: boolean;
  rulesActive: boolean;
}> {
  const res = await sendExtensionCommand<{
    success: boolean;
    rulesActive: boolean;
  }>('PAUSE_FOCUS');

  return {
    success: !!res.success,
    rulesActive: !!res.rulesActive,
  };
}

/**
 * Resume focus session
 */
export async function resumeExtensionFocus(): Promise<boolean> {
  const res = await sendExtensionCommand<{ success: boolean }>('RESUME_FOCUS');
  return !!res.success;
}

/**
 * End focus session and unblock websites
 */
export async function endExtensionFocus(reason = 'user_ended'): Promise<boolean> {
  const res = await sendExtensionCommand<{ success: boolean }>('END_FOCUS', { reason });
  return !!res.success;
}

/**
 * Fetch current blocklist and settings from extension
 */
export async function getExtensionBlocklist(): Promise<{
  blocklist: BlocklistItem[];
  settings: ExtensionSettings;
}> {
  const res = await sendExtensionCommand<{
    success: boolean;
    blocklist: BlocklistItem[];
    settings: ExtensionSettings;
  }>('GET_BLOCKLIST');

  return {
    blocklist: res.blocklist || DEFAULT_BLOCKLIST,
    settings: res.settings || DEFAULT_SETTINGS,
  };
}

/**
 * Update blocklist in extension
 */
export async function updateExtensionBlocklist(
  blocklist: BlocklistItem[]
): Promise<BlocklistItem[]> {
  const res = await sendExtensionCommand<{
    success: boolean;
    blocklist: BlocklistItem[];
  }>('UPDATE_BLOCKLIST', { blocklist });

  return res.blocklist || [];
}

/**
 * Update extension settings (pause/complete behavior)
 */
export async function updateExtensionSettings(
  settings: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const res = await sendExtensionCommand<{
    success: boolean;
    settings: ExtensionSettings;
  }>('UPDATE_SETTINGS', { settings });

  return res.settings || DEFAULT_SETTINGS;
}
