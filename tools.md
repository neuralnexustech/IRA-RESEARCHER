# IRA-RESEARCHER Tools

**40 tools** across 8 categories. Every tool goes through `pipeline.js` for pre/post logging, timing, and centralized error handling.

---

## Navigation (4)

### `ira_navigate`
- **Params:** `url: string`
- Navigate to a URL with retry on empty DOM.
- Uses `page.goto()` with `waitUntil: "domcontentloaded"`, retries once if first attempt returns empty `<body>`.

### `ira_go_back`
- **Params:** none
- Browser history back via `page.goBack()`.

### `ira_go_forward`
- **Params:** none
- Browser history forward via `page.goForward()`.

### `ira_reload`
- **Params:** none
- Reload current page via `page.reload()`.

---

## Interaction (7)

### `ira_click`
- **Params:** `index?: number` (from `ira_get_state`), `x?: number`, `y?: number`
- Click element by index or at raw coordinates.
- When index is given, uses `page.click()` on the interactive element. When coordinates are given, uses `page.mouse.click()`.

### `ira_type`
- **Params:** `index: number`, `text: string`
- Type text into an input field. Uses `getInputSelector()` (only `input`, `textarea`, `[contenteditable]`) — will not attempt to type into buttons or links.

### `ira_hover`
- **Params:** `index: number`
- Hover over an element. Triggers tooltip/popover appearances.

### `ira_drag`
- **Params:** `from: number`, `to: number`
- Drag from one element to another. Dispatches HTML5 drag events: `dragstart` → `dragover` → `drop` → `dragend`. Also simulates mouse movement through intermediate steps.

### `ira_upload`
- **Params:** `index: number`, `filePath: string`
- Upload a file via a file input. Sets the input's `files` property and dispatches `change` event in a single evaluate call to avoid DOM races.

### `ira_select`
- **Params:** `index: number`, `value: string`
- Select a dropdown option via `page.selectOption()`.

### `ira_keyboard`
- **Params:** `key: string`, `modifiers?: string[]` (default `[]`)
- Press keyboard shortcuts. Examples: `Escape`, `Enter`, `Tab`, `ArrowDown`, `a`, `c`.
- Modifiers: `Control`, `Shift`, `Meta`, `Alt`. Presses modifiers down, then the key, then releases modifiers.

---

## Vision & Reading (9)

### `ira_screenshot`
- **Params:** `fullPage?: boolean` (default `false`), `format?: "png"|"jpeg"` (auto: JPEG for viewport, PNG for full), `quality?: number` (default `85`, JPEG only)
- Capture screenshot. JPEG defaults to 30-150KB vs 200KB+ for PNG.

### `ira_element_screenshot`
- **Params:** `index: number`
- Screenshot a specific element by index.

### `ira_extract_images`
- **Params:** none
- Extract all images on the page with `src`, `alt`, `width`, `height`. Scans `<img>` tags, `background-image` CSS, `<canvas>`, and `<video poster>`.

### `ira_get_state`
- **Params:** none
- Returns all interactive elements (`a, button, input, textarea, select, [role="button"], [role="link"], [role="tab"], [onclick], [tabindex]`) with `tag`, `text`, `type`, `rect` (x, y, width, height), and sequential `index`. Indexes match all interaction tools.

### `ira_read_page`
- **Params:** none
- Returns accessibility tree via CDP. Depth limit: 30 (up from 10) for SPA support.

### `ira_find`
- **Params:** `query: string`
- Find elements by text content. Returns matching element info with index for clicking.

### `ira_extract_text`
- **Params:** none
- Extract article/main text from the page.

### `ira_extract_table`
- **Params:** `index?: number` (default `0`)
- Extract HTML `<table>` as structured JSON. Returns `{ tableCount, headers, rows }` where rows are objects keyed by header text.

### `ira_get_html`
- **Params:** `selector?: string` (optional, defaults to `document.documentElement.outerHTML`)
- Get raw HTML. If selector is given, returns `element.outerHTML` for the first match.

---

## Tab Management (4)

### `ira_tabs`
- **Params:** none
- List all open tabs with index, URL, and title.

### `ira_switch_tab`
- **Params:** `tabIndex: number`
- Switch to a tab by index. Calls `page.bringToFront()` and sets `ctx.page`.

### `ira_close_tab`
- **Params:** `tabIndex: number`
- Close a tab by index. If the closed tab is the current one, reassigns `ctx.page` to the nearest remaining tab. Cannot close the last tab.

### `ira_new_tab`
- **Params:** `url?: string` (optional)
- Open a new tab. If URL provided, navigates there with `waitUntil: "domcontentloaded"`. Automatically sets `ctx.page` to the new tab.

---

## Debug & DevTools (9)

### `ira_console`
- **Params:** `pattern?: string`, `onlyErrors?: boolean` (default `false`), `limit?: number` (default `100`)
- Read browser console logs. Filtered by regex `pattern` and/or error-only mode. Reads from Node-side `page.__iraBuffer.logs` (survives navigation).

### `ira_network`
- **Params:** `urlPattern?: string`, `limit?: number` (default `100`)
- Read network requests. Shows method, URL, and status. Reads from Node-side `page.__iraBuffer.requests`.

### `ira_javascript`
- **Params:** `code: string`
- Execute JavaScript in page context. Returns the result as string (JSON-stringified for objects).

### `ira_inspect_element`
- **Params:** `index: number`
- Get DOM tree with computed styles for an element. Returns HTML, bounding box, and CSS properties.

### `ira_get_styles`
- **Params:** `index: number`
- Get computed CSS styles for an element.

### `ira_performance`
- **Params:** none
- Get page performance metrics from `performance.getEntries()` and `performance.timing`.

### `ira_storage`
- **Params:** `type?: "all"|"cookies"|"localStorage"|"sessionStorage"` (default `"all"`)
- View cookies, localStorage, and/or sessionStorage.

### `ira_network_timing`
- **Params:** `urlPattern?: string`
- Get request timing waterfall. Returns DNS, TCP, TLS, TTBF, and total timing for matching requests.

### `ira_audit_accessibility`
- **Params:** none
- Run accessibility audit. Weighted scoring: errors = −20, warnings = −5. Returns issues organized by severity with `summary` field.

---

## Utility (6)

### `ira_wait`
- **Params:** `seconds?: number` (default `3`), `selector?: string`
- Wait for a duration or for a CSS selector to appear. If `selector` given, uses `waitForSelector` with `seconds` as timeout.

### `ira_scroll`
- **Params:** `direction?: "up"|"down"|"left"|"right"` (default `"down"`), `amount?: number` (default `500`, max `5000`)
- Scroll the page with `behavior: "instant"` for no delay.

### `ira_set_viewport`
- **Params:** `width: number`, `height: number`
- Set viewport size. Uses CDP `Emulation.clearDeviceMetricsOverride` + `Browser.setWindowBounds` + `page.setViewport()`. Handles Windows min-width clamp (~516px) gracefully.

### `ira_cookies`
- **Params:** `action: "get"|"set"|"clear"`, `name?: string`, `value?: string`
- Get, set, or clear cookies. Uses `page.cookies()`, `page.setCookie()`, `page.deleteCookie()`.

### `ira_pdf`
- **Params:** `path?: string` (optional, saves to file if given)
- Export current page as PDF. Uses `page.pdf()` with A4 format, print background. Returns PDF buffer or saves to file.

### `ira_intercept`
- **Params:** `urlPattern: string`, `action: "block"|"passthrough"`
- Block or passthrough network requests. On `block`, aborts requests whose URL includes the pattern. On `passthrough`, disables all interception.

---

## Health & Status (1)

### `ira_health`
- **Params:** none
- Check browser connection, page state, and server status. Returns JSON with:
  - `status` — "connected" or "disconnected"
  - `uptime` — server uptime in seconds
  - `browser.connected` — whether Puppeteer browser is connected
  - `browser.pid` — Chrome process ID
  - `browser.pagesOpen` — number of open tabs
  - `currentPage.url` — current tab URL
  - `currentPage.title` — current tab title
  - `currentPage.readyState` — document readyState (loading/interactive/complete)
  - `currentPage.cdpConnected` — whether CDP session is active
  - `currentPage.ghostPanel` — whether ghost panel is injected

---

## Browser Launch

The browser is launched by `browser.js` with smart screen detection and auto-sizing:

- **Screen detection** — detects your usable work area (minus taskbar/dock) cross-platform via PowerShell (Windows), osascript (macOS), or xrandr (Linux)
- **Window modes** — controlled by `IRA_WINDOW` env var:
  - `maximize` — uses `--start-maximized` (most reliable for visible, focused window on Windows)
  - `auto` (default) — uses detected screen work area
  - `WxH` (e.g. `1280x800`) — fixed size, capped at screen max
- **Focus** — CDP `Browser.setWindowBounds` with `windowState: "normal"` called after launch
- **Remote debug** — `--remote-debugging-port=9222` enabled, open `chrome://inspect` to attach DevTools

## Pipeline

Every tool is wrapped by `pipeline.js` middleware:

```
→ ira_tool_name {args}
← ira_tool_name (duration ms)
```

Features:
- Auto-logging with timing
- Centralized try/catch
- Fire-and-forget ghost logging (no latency impact)

The tool function receives `(ctx, args)` and returns `{ content: [{ type: "text", text: "..." }] }`.
