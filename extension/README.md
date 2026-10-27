# StudyOS Focus Mode — Distraction Blocker (Chrome Extension MV3)

A Chrome Extension Manifest V3 companion for **StudyOS** that enforces real website distraction blocking during active Pomodoro study sessions.

---

## 🛠️ Architecture & Technologies

- **Manifest V3** with extension service worker (`background.js`).
- **`chrome.declarativeNetRequest`** dynamic rules:
  - Real-time `redirect` rule for `main_frame` navigation (redirects distracting sites to StudyOS `blocked.html`).
  - Network request `block` rule for subresources (`sub_frame`, `xmlhttprequest`, `media`, `websocket`).
- **`chrome.storage.local`**:
  - Persists focus session state (`isFocusActive`, `isPaused`, `topicTitle`, `sessionEndTime`).
  - Persists custom and preset blocklists.
  - Persists anti-bypass settings (`pauseBehavior`, `completeBehavior`).
- **Secure Web-to-Extension Communication**:
  - Two-way bridge via `content.js` and `window.postMessage` on authorized StudyOS origins (`localhost:5173`, `127.0.0.1:5173`).
  - Supported also via `chrome.runtime.sendMessage(EXTENSION_ID)` using `externally_connectable`.

---

## 🚀 How to Install in Chrome / Edge / Brave

1. Open your Chromium-based browser (Google Chrome, Microsoft Edge, Brave).
2. Navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Toggle **Developer mode** (switch in top-right corner) to **ON**.
4. Click **Load unpacked** (top-left button).
5. In the file picker, select the `extension` folder located inside your StudyOS workspace:
   ```
   c:\Users\Shankar\STUDY PLANNER\extension
   ```
6. The extension **"StudyOS Focus — Distraction Blocker"** will appear in your installed extensions list.
7. *(Optional)* Pin the extension icon in your browser toolbar for quick status monitoring.

---

## 🛡️ Permissions & Privacy

| Permission | Justification |
|---|---|
| `declarativeNetRequest` | Required to register dynamic redirect/blocking rules on configured distracting domains during study sessions. |
| `storage` | Required to store the student's blocklist, pause settings, and session state locally across browser restarts. |
| `alarms` | Required to check session timers and handle auto-completion policies in the background. |
| `tabs` | Used exclusively to redirect existing open tabs of blocked websites when a focus session starts. |
| `<all_urls>` (host_permissions) | Required by Chrome's `declarativeNetRequest` redirect action to redirect user-specified websites to `blocked.html`. |

> **Privacy Guarantee**: StudyOS **never** tracks or logs your browsing history, searches, or visited URLs. All blocklists and rule evaluations are executed 100% locally on your machine.

---

## 🧪 How to Test Website Blocking

1. Open the StudyOS web app: [http://localhost:5173/app/focus](http://localhost:5173/app/focus).
2. The Distraction Blocker panel will show **"Connected • X sites configured"**.
3. Click **"Start Focus Session"**.
4. The status updates to **"🛡️ Distraction Blocking Active"**.
5. In another tab or window, navigate to any blocked website (e.g. `youtube.com`, `instagram.com`, `reddit.com`).
6. You will be redirected immediately to the StudyOS **"Distraction Blocked"** screen with a motivational quote and a button to return to your timer.
7. Test non-blocked websites (e.g. `wikipedia.org`, `google.com`, `github.com`): they load normally without interference.
8. In StudyOS, click **Pause**:
   - By default, blocking stays active to prevent quick bypass.
   - If configured to pause blocking, websites become accessible until you resume.
9. End your session (with confirmation) or let the timer complete to restore normal browsing.
