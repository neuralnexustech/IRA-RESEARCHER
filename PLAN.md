# 🚀 IRA-RESEARCHER — The Ultimate Browser Automation MCP

## 🎯 Vision

The **best browser automation MCP server** ever built. Combining:
- **Claude-in-Chrome** — clean MCP tools, easy setup
- **browser-use** — powerful ghost effects, smart DOM understanding
- **Plus** — stealth mode, auto-recovery, developer tools, anti-detection

---

## 📋 Setup (2 Steps)

### 1. Install
```powershell
cd IRA-RESEARCHER
npm install
npx puppeteer browsers install chrome
```

### 2. Add to MCP Config
```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["path/to/IRA-RESEARCHER/server.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_GHOST": "true",
        "IRA_STEALTH": "true",
        "IRA_PROXY": ""
      }
    }
  }
}
```

---

## 🧩 Full Tool List (32 tools — no LLM needed)

### Navigation (4 tools)
| Tool | Description |
|---|---|
| `ira_navigate` | Go to URL with auto-retry on empty DOM |
| `ira_go_back` | Go back in history |
| `ira_go_forward` | Go forward in history |
| `ira_reload` | Reload current page |

### Interaction (6 tools)
| Tool | Description |
|---|---|
| `ira_click` | Click by element index OR (x,y) coordinates |
| `ira_type` | Type text into input field |
| `ira_hover` | Hover over element |
| `ira_drag` | Click & drag from A to B |
| `ira_upload` | Upload file to input element |
| `ira_select` | Select dropdown option |

### Vision & Reading (8 tools)
| Tool | Description |
|---|---|
| `ira_screenshot` | Take full-page screenshot → returns **image** to Cline |
| `ira_element_screenshot` | Screenshot specific element by index → **cropped image** |
| `ira_extract_images` | Get all `<img>` tags with src, alt, dimensions → can download each |
| `ira_get_state` | Get page state with interactive elements |
| `ira_read_page` | Full accessibility tree |
| `ira_find` | Find elements by text description |
| `ira_extract_text` | Extract article/main text |
| `ira_get_html` | Get raw HTML of page or selector |

### Tab Management (3 tools)
| Tool | Description |
|---|---|
| `ira_tabs` | List all open tabs |
| `ira_switch_tab` | Switch to tab by ID |
| `ira_close_tab` | Close a tab |

### Debug & DevTools (9 tools — full Chrome DevTools access)
| Tool | Description |
|---|---|
| `ira_console` | Read browser console logs (Console tab) |
| `ira_network` | Read network requests (Network tab) |
| `ira_javascript` | Execute JavaScript in page (Console executor) |
| `ira_inspect_element` | Get full DOM tree with computed styles (Elements tab) |
| `ira_get_styles` | Get computed CSS styles of any element (Styles pane) |
| `ira_performance` | Get page load metrics: TTFB, DOM ready, resources (Performance tab) |
| `ira_storage` | View cookies, localStorage, sessionStorage (Application tab) |
| `ira_network_timing` | Get request timing waterfall: TTFB, download, total (Network waterfall) |
| `ira_audit_accessibility` | Run accessibility audit on page (Lighthouse audit) |

### Utility (3 tools)
| Tool | Description |
|---|---|
| `ira_wait` | Wait for element or seconds |
| `ira_scroll` | Scroll page |
| `ira_cookies` | Get/set browser cookies |

> **26 tools, zero LLM dependency.** Cline/Claude Code is the brain. IRA-RESEARCHER is just the hands.

---

## 👻 Ghost Effects v2.0 (Enhanced)

### 1. Floating Action Panel (enhanced from browser-use)
```
┌────────────────────────────────────┐
│ 🤖 IRA-RESEARCHER         3/12    │ ← Action counter
├────────────────────────────────────┤
│                                      │
│ ⏱ 2s ago  ▶️ Navigated to google.com │ ← Green border
│ ⏱ 1s ago  🖱️ Clicked #2 "Search"    │ ← Green border
│ ⏱ 0s ago  ⌨️ Typed "AI research"    │ ← Green border
│ ⏱ 0s ago  📸 Screenshot saved       │ ← Blue border
│                                      │
├────────────────────────────────────┤
│ 🔵 Active   ✅ Done   ⚠️ Warning     │ ← Status bar
└────────────────────────────────────┘
```
- **Action counter** showing step X/Y in header
- **Relative timestamps** (2s ago, 1m ago)
- **Status bar** at bottom showing current state
- **Keyboard shortcut** to toggle (Ctrl+Shift+I)

### 2. Click Ripple Animation (enhanced)
```css
/* Click at (x,y) shows expanding orange ring */
@keyframes clickRipple {
  0%   { transform: scale(0.5); opacity: 1; }
  50%  { transform: scale(2); opacity: 0.5; }
  100% { transform: scale(3); opacity: 0; }
}
/* Plus a persistent dot at center */
```
- **Expanding ring** animation (0.5s)
- **Center dot** that fades slowly (2s)
- **Click coordinates** shown as label

### 3. Typing Animation (NEW)
```css
/* Green glow effect when typing into field */
@keyframes typingGlow {
  0%   { box-shadow: 0 0 5px rgba(34,197,94,0.3); }
  50%  { box-shadow: 0 0 15px rgba(34,197,94,0.5); }
  100% { box-shadow: 0 0 5px rgba(34,197,94,0.3); }
}
```
- **Green glow** around input field while typing
- **Character-by-character** ghost text overlay
- Auto-fades after typing completes

### 4. Drag Path Animation (NEW)
```css
/* Red dotted arrow from start → end */
/* Arrow head at destination */
/* Dashed line animates along path */
@keyframes dragPath {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
```
- **SVG arrow** from start to end position
- **Animated dashed line** drawing itself
- **Arrow head** at destination point
- **Coordinate labels** at start and end

### 5. Scroll Indicator (NEW)
```
          ↑ (scrolled up 3 ticks)
  ┌─────────────────┐
  │                  │
  │   Page Content   │
  │                  │
  └─────────────────┘
          ↓ (scrolled down 3 ticks)
```
- **Arrow** showing scroll direction
- **Tick count** label
- Fades out after 1.5s

### 6. Element Index Labels (enhanced)
```
  ┌──────┐    ┌──────────┐    ┌───────┐
  │ [1]  │    │ [2]      │    │ [3]   │
  │ Login│    │ Search → │    │ About │
  └──────┘    └──────────┘    └───────┘
```
- **Numbered badges** on all interactive elements
- **Hover effect**: label expands to show element name
- **Click**: badge pulses to confirm

### 7. Screenshot Flash (NEW)
- **Brief white flash** on screen when screenshot taken
- **"📸"** indicator in corner

---

## 🛡️ Smart Features

### 1. Auto-Wait for Elements
```javascript
// Before clicking, auto-wait for element to appear (5s timeout)
async function click(index) {
  const el = await page.waitForSelector(`[data-ira-index="${index}"]`, { timeout: 5000 });
  if (!el) throw new Error(`Element ${index} not found after 5s`);
  // ... click
}
```

### 2. Auto-Retry on Failure
```javascript
// Retry up to 3 times with exponential backoff
async function retryAction(action, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try { return await action(); }
    catch (e) { 
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### 3. Empty DOM Detection & Recovery
```javascript
// If page looks blank after navigation, wait + reload
async function navigateWithRecovery(url) {
  await page.goto(url);
  const content = await page.content();
  if (content.length < 500) {  // Too short = likely empty
    await new Promise(r => setTimeout(r, 3000));
    await page.reload();
    // Wait up to 10s for real content
  }
}
```

### 4. Stealth Mode (Anti-Detection)
```javascript
// Override navigator properties to avoid bot detection
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
// Also:
// - Fake webdriver property
// - Override chrome detection
// - Randomize mouse movements
// - Add natural typing delays
```

### 5. Smart Click (center-point calculation)
```javascript
// Always click in the CENTER of elements, not edges
async function smartClick(element) {
  const box = await element.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  // Add tiny random offset (±2px) for human-like feel
  await page.mouse.click(cx + random(-2, 2), cy + random(-2, 2));
}
```

### 6. Human-Like Typing
```javascript
// Type with random delays between characters
async function humanType(page, selector, text) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: 30 + Math.random() * 70 });
  }
}
```

### 7. Page Health Monitor
```javascript
// Detect: loading, timeout, error pages, captcha
function detectPageHealth() {
  // Check for common error indicators
  const errorPatterns = ['403', '404', '500', 'captcha', 'blocked'];
  // Check for loading indicators
  const loadingPatterns = ['loading', 'spinner', 'skeleton'];
  return { healthy, loading, error, errorType };
}
```

---

## 🛠️ Developer Experience

### 1. Session Persistence
```javascript
// Save session (cookies, localStorage, page states) to disk
async function saveSession(path) {
  const cookies = await page.cookies();
  const storage = await page.evaluate(() => JSON.stringify(localStorage));
  fs.writeFileSync(path, JSON.stringify({ cookies, storage }));
}

// Restore session on restart
async function restoreSession(path) {
  const data = JSON.parse(fs.readFileSync(path));
  await page.setCookie(...data.cookies);
  await page.evaluate((s) => localStorage = JSON.parse(s), data.storage);
}
```

### 2. Auto-Recovery
```javascript
// If browser crashes, auto-restart
process.on('uncaughtException', async (err) => {
  console.error('Crash detected, restarting browser...');
  await browser.close();
  browser = await puppeteer.launch({ ... });
});
```

### 3. Better Error Messages
```javascript
// Context-aware error messages
function formatError(error, context) {
  return {
    error: error.message,
    tool: context.tool,
    suggestion: getSuggestion(error), // e.g., "Try scrolling down or check if element exists"
    timestamp: new Date().toISOString(),
  };
}
```

### 4. Debug Logging
```javascript
// Verbose logging when IRA_DEBUG=true
if (process.env.IRA_DEBUG) {
  console.log('[IRA-DEBUG]', action, params, result);
  // Screenshot every step for debugging
  await page.screenshot({ path: `debug/step-${step}.png` });
}
```

### 5. Proxy Support (with auto-rotation)

Single proxy:
```json
"env": {
  "IRA_PROXY": "http://user:pass@proxy:8080"
}
```

**Auto-rotate from pool** (random each session):
```json
"env": {
  "IRA_PROXY": "http://proxy1:8080,http://proxy2:8080,socks5://proxy3:1080",
  "IRA_PROXY_ROTATE": "true"
}
```

- If `IRA_PROXY_ROTATE=true` → picks a **random proxy** from the comma-separated list on each browser launch
- If `IRA_PROXY_ROTATE=false` or omitted → uses the single proxy
- If `IRA_PROXY` is empty → **no proxy** (direct connection)
- Logs which proxy is active: `[IRA] Using proxy: http://proxy2:8080`

### 6. Cookie Manager Tool
```javascript
// Get all cookies for current domain
ira_cookies({ action: "get" })
// Set specific cookie
ira_cookies({ action: "set", name: "token", value: "abc" })
// Clear all cookies
ira_cookies({ action: "clear" })
```

---

## 📦 Dependencies (no LLM needed!)

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "puppeteer": "^23.0.0",
    "puppeteer-extra": "^3.3.0",
    "puppeteer-extra-plugin-stealth": "^2.11.0",
    "zod": "^3.23.0"
  }
}
```
> **Zero API keys required.** Pure browser automation. Cline/Claude Code provides the intelligence.

---

## 🏗️ File Structure

```
IRA-RESEARCHER/
│
├── src/                           ← Source code
│   ├── index.js                   ← Entry point: starts MCP server
│   ├── server.js                  ← MCP server setup + tool registration
│   ├── browser.js                 ← Puppeteer browser launch + session
│   │
│   ├── tools/                     ← Tool implementations (one file per category)
│   │   ├── navigation.js          ← ira_navigate, go_back, go_forward, reload
│   │   ├── interaction.js         ← ira_click, type, hover, drag, upload, select
│   │   ├── vision.js              ← ira_screenshot, element_screenshot, extract_images
│   │   ├── reading.js             ← ira_get_state, read_page, find, extract_text, get_html
│   │   ├── tabs.js                ← ira_tabs, switch_tab, close_tab
│   │   ├── debug.js               ← ira_console, network, javascript
│   │   ├── devtools.js            ← ira_inspect_element, get_styles, performance, storage, network_timing, audit_accessibility
│   │   └── utility.js             ← ira_wait, scroll, cookies
│   │
│   ├── ghost/                     ← Ghost effects (injected into pages)
│   │   ├── panel.js               ← Floating action panel (dark UI)
│   │   ├── ripple.js              ← Click ripple animation (orange circle)
│   │   ├── typing.js              ← Typing glow animation (green)
│   │   ├── drag.js                ← Drag path SVG arrows
│   │   ├── scroll.js              ← Scroll indicators
│   │   ├── labels.js              ← Element index labels
│   │   ├── flash.js               ← Screenshot flash effect
│   │   └── index.js               ← Combines all ghost scripts into one
│   │
│   ├── stealth.js                 ← Anti-detection (puppeteer-extra)
│   └── utils.js                   ← Shared utilities (retry, wait, format)
│
├── package.json                   ← Dependencies
├── install.ps1                    ← Windows one-click install
├── install.sh                     ← Mac/Linux one-click install
├── README.md                      ← Usage docs + examples
├── PLAN.md                        ← This file
├── comparison-analysis.md         ← Analysis of all 4 browser MCPs
└── debug/                         ← Debug screenshots (when IRA_DEBUG=true)
```

### File sizes (estimated)
| File | Lines | Purpose |
|---|---|---|
| `src/index.js` | 30 | Entry point |
| `src/server.js` | 150 | MCP tool registration |
| `src/browser.js` | 200 | Puppeteer + stealth launch |
| `src/tools/navigation.js` | 120 | 4 navigation tools |
| `src/tools/interaction.js` | 200 | 6 interaction tools |
| `src/tools/vision.js` | 150 | 3 vision tools |
| `src/tools/reading.js` | 180 | 5 reading tools |
| `src/tools/tabs.js` | 100 | 3 tab tools |
| `src/tools/debug.js` | 100 | 3 debug tools |
| `src/tools/devtools.js` | 250 | 6 DevTools tools |
| `src/tools/utility.js` | 80 | 3 utility tools |
| `src/ghost/*.js` | 400 | 7 ghost effects |
| `src/stealth.js` | 80 | Anti-detection |
| `src/utils.js` | 60 | Shared helpers |
| **Total** | **~2,100** | **32 tools + 7 ghost effects** |

---

## 🔧 Implementation Phases

### Phase 1 — Core
- `server.js` with MCP server + Puppeteer
- 5 basic tools: navigate, click, type, screenshot, get_state
- Basic ghost panel

### Phase 2 — Full Tools
- All 25 tools
- Tab management
- Debug tools (console, network)
- Form tools (select, upload, cookies)

### Phase 3 — Ghost v2.0
- Enhanced floating panel with counter
- Click ripple animation
- Typing animation (green glow)
- Drag path arrows
- Scroll indicators
- Element index labels
- Screenshot flash

### Phase 4 — Smart Features
- Auto-wait for elements
- Auto-retry (3 attempts)
- Empty DOM recovery
- Stealth mode (puppeteer-extra)
- Human-like typing
- Page health monitoring

### Phase 5 — Developer Experience
- Session persistence
- Auto-recovery on crash
- Better error messages
- Debug logging
- Proxy support
- README + install scripts

---

## 📊 Comparison: IRA-RESEARCHER vs Others

| Feature | Claude-in-Chrome | browser-use | **IRA-RESEARCHER** |
|---|---|---|---|
| Setup complexity | Hard (extension+host+config) | Medium (pip+key) | **Easy (npm + 2 lines)** |
| Language | JavaScript | Python | **JavaScript** |
| Browser launch | Manual | Auto | **Auto** |
| Tools count | 18 | 14 | **25** |
| Ghost panel | None | Yes (922 lines) | **Yes (enhanced v2)** |
| Click ripple | None | Yes (basic) | **Yes (animated ring)** |
| Typing animation | None | None | **Yes (green glow)** |
| Drag arrows | None | None | **Yes (SVG arrow)** |
| Scroll indicator | None | None | **Yes** |
| Action counter | None | None | **Yes** |
| Auto-wait | None | Yes | **Yes** |
| Auto-retry | None | Yes | **Yes** |
| Stealth/anti-detect | None | Cloud only | **puppeteer-extra** |
| Human-like typing | None | None | **Yes (random delays)** |
| Session persistence | None | Yes | **Yes** |
| Proxy support | None | Yes | **Yes** |
| Debug logging | None | Yes | **Yes** |
| Empty DOM recovery | None | Yes | **Yes** |
| Page health check | None | None | **Yes** |
| Cookie manager | None | None | **Yes** |
| Dependencies | Chrome+Node | Python+20+pkgs | **Node+3 pkgs** |

---

## ✅ Master Checklist

- [ ] `package.json`
- [ ] `server.js` — MCP server skeleton + Puppeteer
- [ ] `ghost-effects.js` — All ghost animations
- [ ] `stealth.js` — Anti-detection
- [ ] Navigation tools: navigate, go_back, go_forward, reload
- [ ] Interaction tools: click, type, hover, drag, upload, select
- [ ] Reading tools: screenshot, get_state, read_page, find, extract_text, get_html
- [ ] Tab tools: tabs, switch_tab, close_tab
- [ ] Debug tools: console, network, javascript
- [ ] Utility tools: wait, scroll, cookies
- [ ] Ghost: floating panel with counter
- [ ] Ghost: click ripple animation
- [ ] Ghost: typing glow animation
- [ ] Ghost: drag path SVG arrows
- [ ] Ghost: scroll indicators
- [ ] Ghost: element index labels
- [ ] Ghost: screenshot flash
- [ ] Smart: auto-wait for elements
- [ ] Smart: auto-retry with backoff
- [ ] Smart: empty DOM recovery
- [ ] Smart: stealth mode
- [ ] Smart: human-like typing
- [ ] Smart: page health monitor
- [ ] DX: session persistence
- [ ] DX: auto-recovery
- [ ] DX: better error messages
- [ ] DX: debug logging
- [ ] DX: proxy support
- [ ] `install.ps1` + `install.sh`
- [ ] `README.md`
- [ ] Test with Cline