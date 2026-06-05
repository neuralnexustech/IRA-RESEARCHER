/**
 * Ghost Effects — Injected into every page
 * Drawn from browser-use's _DEMO_PANEL_SCRIPT with improvements:
 *   - Markdown rendering + expand/collapse for long messages
 *   - Live-updating relative timestamps (setInterval)
 *   - Session persistence (panel state & logs survive page nav)
 *   - Responsive panel width + body margin push
 *   - Typing cursor border animation
 *   - Notif uses class (not id) to survive re-injection
 *   - Auto-scroll to bottom on new entries
 *
 * Effects: floating panel (tabbed, filterable), click ripple, typing glow,
 *          drag path, scroll indicators, element labels, screenshot flash
 */

export function ghostScript() {
  return `
(function() {
  if (window.__iraGhostLoaded) return;
  window.__iraGhostLoaded = true;

  const PANEL_ID   = 'ira-researcher-panel';
  const TOGGLE_ID  = 'ira-researcher-toggle';
  const STYLE_ID   = 'ira-researcher-style';
  const MAX_LOGS   = 100;
  const STORAGE_KEY = '__iraLogs__';
  const PANEL_STATE_KEY = '__iraPanelState__';

  // ─── Styles ────────────────────────────────────────────────────────────────
  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = \`
      #\${PANEL_ID} {
        position: fixed; top: 12px; right: 12px;
        width: var(--ira-panel-width, 300px); max-height: calc(100vh - 24px);
        background: rgba(9,9,11,0.55); color: #f4f4f5;
        font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 11px;
        border: 0.5px solid rgba(255,255,255,0.15);
        border-radius: 12px; overflow: hidden;
        display: flex; flex-direction: column;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 2147480000; backdrop-filter: blur(24px) saturate(180%);
        transform: translateX(0); opacity: 1;
        transition: transform 0.22s ease, opacity 0.22s ease;
      }
      #\${PANEL_ID}[data-open="false"] {
        transform: translateX(calc(100% + 20px)); opacity: 0; pointer-events: none;
      }

      /* ── Resize handle ── */
      #\${PANEL_ID} .ira-resize {
        position: absolute; top: 0; left: 0; width: 4px; height: 100%;
        cursor: ew-resize; z-index: 1;
      }
      #\${PANEL_ID} .ira-resize:hover { background: rgba(249,115,22,0.3); }

      /* ── Header ── */
      .ira-hd {
        display: flex; align-items: center; gap: 7px;
        padding: 10px 12px 9px;
        border-bottom: 0.5px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        flex-shrink: 0;
      }
      .ira-hd-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #f97316; flex-shrink: 0;
      }
      .ira-hd-title {
        font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em;
        text-transform: uppercase; color: #f4f4f5; flex: 1;
      }
      .ira-hd-badge {
        font-size: 9px; font-weight: 600;
        background: rgba(249,115,22,0.15); color: #f97316;
        padding: 1px 6px; border-radius: 10px; letter-spacing: 0.04em;
      }
      .ira-hd-close {
        width: 20px; height: 20px; border-radius: 50%;
        border: 0.5px solid rgba(255,255,255,0.15);
        background: transparent; color: #71717a; cursor: pointer; font-size: 13px;
        display: flex; align-items: center; justify-content: center; line-height: 1;
        transition: background 0.15s;
      }
      .ira-hd-close:hover { background: rgba(255,255,255,0.08); color: #f4f4f5; }

      /* ── Tabs ── */
      .ira-tabs {
        display: flex; border-bottom: 0.5px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02); flex-shrink: 0;
      }
      .ira-tab {
        flex: 1; padding: 5px 0; font-size: 9.5px; font-weight: 600;
        letter-spacing: 0.05em; text-transform: uppercase; text-align: center;
        color: #71717a; border: none; background: transparent; cursor: pointer;
        border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s;
      }
      .ira-tab.active { color: #f97316; border-bottom-color: #f97316; }
      .ira-tab:hover:not(.active) { color: #a1a1aa; }

      /* ── Log body ── */
      .ira-body {
        flex: 1; overflow-y: auto; min-height: 0;
      }
      .ira-body::-webkit-scrollbar { width: 3px; }
      .ira-body::-webkit-scrollbar-track { background: transparent; }
      .ira-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

      /* ── Log entry ── */
      .ira-entry {
        display: flex; align-items: flex-start; gap: 8px;
        padding: 6px 12px; border-bottom: 0.5px solid rgba(255,255,255,0.05);
        border-left: 2px solid transparent;
        animation: iraSlideIn 0.18s ease;
        transition: background 0.1s;
      }
      .ira-entry:last-child { border-bottom: none; }
      .ira-entry:hover { background: rgba(255,255,255,0.03); }
      .ira-entry.level-action { border-left-color: #34d399; }
      .ira-entry.level-thought { border-left-color: #f97316; }
      .ira-entry.level-success { border-left-color: #22c55e; }
      .ira-entry.level-error { border-left-color: #f87171; }
      .ira-entry.level-info { border-left-color: #818cf8; }

      .ira-entry-icon {
        width: 20px; height: 20px; border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; margin-top: 0.5px; font-style: normal; font-size: 11px;
      }
      .ira-entry-icon.level-action  { background: rgba(52,211,153,0.15); color: #34d399; }
      .ira-entry-icon.level-thought { background: rgba(249,115,22,0.13);  color: #f97316; }
      .ira-entry-icon.level-success { background: rgba(34,197,94,0.14);   color: #22c55e; }
      .ira-entry-icon.level-error   { background: rgba(239,68,68,0.15);   color: #f87171; }
      .ira-entry-icon.level-info    { background: rgba(99,102,241,0.15);  color: #818cf8; }

      .ira-entry-body { flex: 1; min-width: 0; }
      .ira-entry-text { color: #e4e4e7; font-size: 11px; line-height: 1.45; word-break: break-word; }
      .ira-entry-text strong { font-weight: 600; color: #f4f4f5; }
      .ira-entry-text code {
        background: rgba(255,255,255,0.08); padding: 1px 4px; border-radius: 2px; font-size: 10px;
      }
      .ira-entry-text a { color: #818cf8; text-decoration: underline; }
      .ira-entry-time { font-size: 9px; color: #52525b; margin-top: 2px; }

      .ira-entry-pill {
        font-size: 8.5px; font-weight: 600; text-transform: uppercase;
        padding: 1px 5px; border-radius: 3px; letter-spacing: 0.05em;
        flex-shrink: 0; align-self: center;
      }
      .ira-entry-pill.level-action  { background: rgba(52,211,153,0.12); color: #34d399; }
      .ira-entry-pill.level-thought { background: rgba(249,115,22,0.11); color: #f97316; }
      .ira-entry-pill.level-success { background: rgba(34,197,94,0.12);  color: #22c55e; }
      .ira-entry-pill.level-error   { background: rgba(239,68,68,0.12);  color: #f87171; }
      .ira-entry-pill.level-info    { background: rgba(99,102,241,0.12); color: #818cf8; }

      .ira-entry-toggle {
        font-size: 9px; color: #818cf8; cursor: pointer; background: none;
        border: 0.5px solid rgba(129,140,248,0.25); border-radius: 3px;
        padding: 1px 6px; margin-top: 4px; transition: background 0.15s;
      }
      .ira-entry-toggle:hover { background: rgba(129,140,248,0.1); }

      .ira-entry:not(.expanded) .ira-entry-text-long {
        max-height: 60px; overflow: hidden;
        mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30px, rgba(0,0,0,0));
      }

      .ira-empty {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 32px 16px; gap: 6px; color: #52525b; font-size: 11px; text-align: center;
      }
      .ira-empty-icon { font-size: 22px; margin-bottom: 4px; }

      /* ── Footer ── */
      .ira-footer {
        display: flex; align-items: center; gap: 6px;
        padding: 7px 12px; border-top: 0.5px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02); flex-shrink: 0;
      }
      .ira-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
      .ira-status-dot.disconnected { background: #f87171; }
      .ira-status-text { font-size: 9.5px; color: #71717a; flex: 1; }
      .ira-footer-btn {
        font-size: 9.5px; color: #71717a;
        border: 0.5px solid rgba(255,255,255,0.1); border-radius: 4px;
        background: transparent; padding: 2px 7px; cursor: pointer; transition: background 0.15s;
      }
      .ira-footer-btn:hover { background: rgba(255,255,255,0.06); color: #a1a1aa; }

      /* ── Toggle ── */
      #\${TOGGLE_ID} {
        position: fixed; top: 16px; right: 16px;
        width: 38px; height: 38px; border-radius: 50%;
        border: 0.5px solid rgba(255,255,255,0.15);
        background: #09090b; color: #f97316;
        font-size: 17px; cursor: pointer; z-index: 2147480001;
        display: none; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        transition: transform 0.15s;
      }
      #\${TOGGLE_ID}:hover { transform: scale(1.06); }
      .ira-toggle-notif {
        position: absolute; top: 5px; right: 5px;
        width: 8px; height: 8px; border-radius: 50%;
        background: #22c55e; border: 1.5px solid #09090b;
        display: none;
      }

      /* ── Animations ── */
      @keyframes iraSlideIn {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes clickRipple {
        0%   { transform: scale(0.4); opacity: 0.8; }
        100% { transform: scale(3);   opacity: 0; }
      }
      @keyframes cursorBlink {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0; }
      }
      @keyframes iraLabelIn {
        from { opacity: 0; transform: scale(0.6); }
        to   { opacity: 1; transform: scale(1); }
      }
    \`;
    document.head.appendChild(s);
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  let panelLogs    = [];
  let isOpen       = true;
  let activeFilter = 'all';
  let unseenCount  = 0;
  let timeInterval = null;

  const ICONS = {
    action:  '▶',
    info:    'i',
    thought: '◈',
    success: '✓',
    error:   '✕',
  };

  // ─── Panel build ───────────────────────────────────────────────────────────
  function buildPanel() {
    const el = document.createElement('section');
    el.id = PANEL_ID;
    el.setAttribute('data-open', 'true');
    el.innerHTML = \`
      <div class="ira-resize"></div>
      <div class="ira-hd">
        <div class="ira-hd-dot"></div>
        <span class="ira-hd-title">IRA Researcher</span>
        <span class="ira-hd-badge" id="ira-badge">0</span>
        <button class="ira-hd-close" id="ira-close-btn" aria-label="Close panel">✕</button>
      </div>
      <div class="ira-tabs">
        <button class="ira-tab active" data-filter="all">All</button>
        <button class="ira-tab" data-filter="action">Actions</button>
        <button class="ira-tab" data-filter="thought">Thoughts</button>
        <button class="ira-tab" data-filter="error">Errors</button>
      </div>
      <div class="ira-body" id="ira-log-list">
        <div class="ira-empty" id="ira-empty">
          <div class="ira-empty-icon">◎</div>
          <div>No logs yet</div>
        </div>
      </div>
      <div class="ira-footer">
        <div class="ira-status-dot" id="ira-status-dot"></div>
        <span class="ira-status-text" id="ira-status-text">Connected · 0 events</span>
        <button class="ira-footer-btn" id="ira-clear-btn">Clear</button>
        <button class="ira-footer-btn" id="ira-copy-btn">⎘ Copy</button>
      </div>
    \`;
    return el;
  }

  function buildToggle() {
    const btn = document.createElement('button');
    btn.id = TOGGLE_ID;
    btn.innerHTML = '◎<div class="ira-toggle-notif"></div>';
    btn.setAttribute('aria-label', 'Open IRA Researcher panel');
    btn.addEventListener('click', openPanel);
    return btn;
  }

  // ─── Resize ────────────────────────────────────────────────────────────────
  function initResize(panel) {
    const handle = panel.querySelector('.ira-resize');
    if (!handle) return;
    let startX, startW;
    function onMove(e) {
      const dx = e.clientX - startX;
      const w = Math.max(220, Math.min(500, startW - dx));
      panel.style.setProperty('--ira-panel-width', w + 'px');
      document.documentElement.style.setProperty('--ira-panel-width', w + 'px');
      try { sessionStorage.setItem('__iraPanelWidth__', String(w)); } catch {}
    }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
    handle.addEventListener('mousedown', (e) => {
      startX = e.clientX; startW = panel.offsetWidth;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
  }

  // ─── Open / Close ──────────────────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    unseenCount = 0;
    const panel  = document.getElementById(PANEL_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (panel)  panel.setAttribute('data-open', 'true');
    if (toggle) toggle.style.display = 'none';
    panel.querySelectorAll('.ira-toggle-notif').forEach(n => n.style.display = 'none');
    renderLogs();
    persistState();
  }

  function closePanel() {
    isOpen = false;
    const panel  = document.getElementById(PANEL_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (panel)  panel.setAttribute('data-open', 'false');
    if (toggle) toggle.style.display = 'flex';
    persistState();
  }

  function adjustBodyMargin() {
    const root = document.documentElement;
    root.style.marginRight = '';
    root.style.width = '';
    document.body.style.marginRight = '';
  }

  function persistState() {
    try { sessionStorage.setItem(PANEL_STATE_KEY, isOpen ? 'open' : 'closed'); } catch {}
  }

  function loadState() {
    try {
      const stored = sessionStorage.getItem(PANEL_STATE_KEY);
      if (stored === 'closed') isOpen = false;
      const w = sessionStorage.getItem('__iraPanelWidth__');
      if (w) document.documentElement.style.setProperty('--ira-panel-width', w + 'px');
    } catch {}
  }

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.ira-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === filter);
    });
    renderLogs();
  }

  // ─── Log render ────────────────────────────────────────────────────────────
  function relTime(ts) {
    const d = Math.round((Date.now() - ts) / 1000);
    if (d < 5)  return 'just now';
    if (d < 60) return d + 's ago';
    if (d < 3600) return Math.round(d / 60) + 'm ago';
    return Math.round(d / 3600) + 'h ago';
  }

  function updateTimestamps() {
    document.querySelectorAll('.ira-entry-time').forEach(el => {
      const ts = parseInt(el.dataset.ts, 10);
      if (ts) el.textContent = relTime(ts);
    });
  }

  function renderLogs() {
    const list  = document.getElementById('ira-log-list');
    const badge = document.getElementById('ira-badge');
    if (!list) return;

    const filtered = activeFilter === 'all'
      ? panelLogs
      : panelLogs.filter(l => l.level === activeFilter);

    list.innerHTML = '';

    if (filtered.length === 0) {
      const e = document.createElement('div');
      e.className = 'ira-empty';
      e.innerHTML = '<div class="ira-empty-icon">◎</div><div>No '
        + (activeFilter === 'all' ? '' : activeFilter + ' ')
        + 'logs yet</div>';
      list.appendChild(e);
    } else {
      filtered.forEach(log => list.appendChild(buildEntry(log)));
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    }

    if (badge) badge.textContent = panelLogs.length;
    const statusText = document.getElementById('ira-status-text');
    if (statusText) statusText.textContent = 'Connected · ' + panelLogs.length + ' event' + (panelLogs.length === 1 ? '' : 's');
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatMessage(msg) {
    const e = escapeHtml(msg);
    return e
      .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
      .replace(/\`([^\\\`]+)\`/g, '<code>$1</code>')
      .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*([^*]+)\\*/g, '<em>$1</em>')
      .replace(/(https?:\\/\\/[^\\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\\n/g, '<br>');
  }

  function buildEntry(log) {
    const div = document.createElement('div');
    div.className = 'ira-entry level-' + log.level;
    const msgHtml = formatMessage(log.message);
    const isLong = log.message.length > 160;

    div.innerHTML = \`
      <div class="ira-entry-icon level-\${log.level}">\${ICONS[log.level] || 'i'}</div>
      <div class="ira-entry-body">
        <div class="ira-entry-text\${isLong ? ' ira-entry-text-long' : ''}">\${msgHtml}</div>
        <div class="ira-entry-time" data-ts="\${log.time}">\${relTime(log.time)}</div>
        \${isLong ? '<button class="ira-entry-toggle">Show more</button>' : ''}
      </div>
      <span class="ira-entry-pill level-\${log.level}">\${log.level}</span>
    \`;

    if (isLong) {
      const toggle = div.querySelector('.ira-entry-toggle');
      toggle.addEventListener('click', () => {
        const expanded = div.classList.toggle('expanded');
        toggle.textContent = expanded ? 'Show less' : 'Show more';
      });
    } else {
      div.classList.add('expanded');
    }
    return div;
  }

  // ─── addLog ────────────────────────────────────────────────────────────────
  function addLog(level, message) {
    panelLogs.push({ level, message, time: Date.now() });
    if (panelLogs.length > MAX_LOGS) panelLogs.shift();

    if (isOpen) {
      renderLogs();
    } else {
      unseenCount++;
      document.querySelectorAll('.ira-toggle-notif').forEach(n => n.style.display = 'block');
    }
    persistLogs();
  }

  // ─── Session persistence ────────────────────────────────────────────────
  function persistLogs() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(panelLogs));
    } catch {}
  }

  function restoreLogs() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) panelLogs = parsed;
      }
    } catch {}
  }

  // ─── Clear / Copy ──────────────────────────────────────────────────────────
  function clearLogs() {
    panelLogs = [];
    renderLogs();
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function copyLogs() {
    const text = panelLogs
      .map(l => '[' + l.level.toUpperCase() + '] ' + l.message)
      .join('\\n');
    navigator.clipboard?.writeText(text).catch(() => {});
    const btn = document.getElementById('ira-copy-btn');
    if (btn) { btn.textContent = '✓ Copied'; setTimeout(() => btn.textContent = '⎘ Copy', 1500); }
  }

  // ─── Visual effects ────────────────────────────────────────────────────────
  function clickRipple(x, y) {
    const dot = document.createElement('div');
    dot.style.cssText = \`
      position:fixed;left:\${x-15}px;top:\${y-15}px;
      width:30px;height:30px;border-radius:50%;
      background:rgb(249,115,22);opacity:0.6;
      pointer-events:none;z-index:2147483647;
      animation:clickRipple 0.5s ease-out forwards;
    \`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 600);

    const lbl = document.createElement('div');
    lbl.style.cssText = \`
      position:fixed;left:\${x+12}px;top:\${y-12}px;
      padding:2px 6px;background:rgba(0,0,0,0.75);color:#f97316;
      font-size:10px;font-family:monospace;border-radius:3px;
      pointer-events:none;z-index:2147483647;
      opacity:0;transition:opacity 0.3s ease;
    \`;
    lbl.textContent = \`(\${Math.round(x)}, \${Math.round(y)})\`;
    document.body.appendChild(lbl);
    requestAnimationFrame(() => lbl.style.opacity = '1');
    setTimeout(() => { lbl.style.opacity = '0'; setTimeout(() => lbl.remove(), 300); }, 1200);
  }

  function typingGlow() {
    const el = document.activeElement;
    if (!el || !/^(INPUT|TEXTAREA|SELECT)$/i.test(el.tagName) && !el.isContentEditable) return;
    // Animated cursor border
    const origOutline = el.style.outline;
    el.style.outline = 'none';
    el.style.transition = 'box-shadow 0.3s ease';
    el.style.boxShadow = '0 0 0 2px rgba(34,197,94,0.5), 0 0 16px rgba(34,197,94,0.25)';
    // cursor blink bar at end of text
    const span = document.createElement('span');
    span.style.cssText = 'display:inline-block;width:2px;height:1em;background:#22c55e;margin-left:1px;vertical-align:text-bottom;animation:cursorBlink 0.8s infinite;pointer-events:none;';
    // Inject via tiny overlay simulation — simpler: just flash the border
    setTimeout(() => {
      el.style.boxShadow = 'none';
      if (origOutline !== undefined) el.style.outline = origOutline;
    }, 1800);
  }

  function dragPath(fromX, fromY, toX, toY) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style',
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646;');
    const defs   = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id',         'ira-arrow');
    marker.setAttribute('markerWidth',  '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX',  '10');
    marker.setAttribute('refY',  '3.5');
    marker.setAttribute('orient','auto');
    marker.innerHTML = '<polygon points="0 0,10 3.5,0 7" fill="#ef4444"/>';
    defs.appendChild(marker);
    svg.appendChild(defs);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', fromX); line.setAttribute('y1', fromY);
    line.setAttribute('x2', toX);   line.setAttribute('y2', toY);
    line.setAttribute('stroke',       '#ef4444');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '8,4');
    line.setAttribute('marker-end', 'url(#ira-arrow)');
    svg.appendChild(line);
    document.body.appendChild(svg);
    setTimeout(() => svg.remove(), 1500);
  }

  function scrollIndicator(direction, amount) {
    const arrows = { up: '↑', down: '↓', left: '←', right: '→' };
    const el = document.createElement('div');
    const isVert = direction === 'up' || direction === 'down';
    el.style.cssText = \`
      position:fixed;
      \${isVert ? 'right:30px;' : 'bottom:50%;transform:translateY(50%);'}
      \${direction === 'up'    ? 'top:20px;'    : ''}
      \${direction === 'down'  ? 'bottom:20px;' : ''}
      \${direction === 'left'  ? 'left:20px;'   : ''}
      \${direction === 'right' ? 'right:20px;'  : ''}
      padding:8px 14px;background:rgba(9,9,11,0.85);color:#f97316;
      font-size:22px;font-family:monospace;border-radius:8px;
      pointer-events:none;z-index:2147483647;
      opacity:1;transition:opacity 0.5s ease;
      border:0.5px solid rgba(249,115,22,0.3);
    \`;
    el.textContent = \`\${arrows[direction] || '↓'} \${Math.round(amount)}px\`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 1000);
  }

  function screenshotFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = \`
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:white;opacity:0;pointer-events:none;z-index:2147483647;
      transition:opacity 0.15s ease;
    \`;
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.opacity = '0.18';
      setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 300); }, 100);
    });

    const lbl = document.createElement('div');
    lbl.style.cssText = \`
      position:fixed;top:16px;right:60px;padding:4px 10px;
      background:rgba(9,9,11,0.8);color:#f4f4f5;font-size:12px;
      border-radius:6px;font-family:monospace;
      pointer-events:none;z-index:2147483647;
      opacity:0;transition:opacity 0.3s ease;
    \`;
    lbl.textContent = '📸 Screenshot';
    document.body.appendChild(lbl);
    requestAnimationFrame(() => lbl.style.opacity = '1');
    setTimeout(() => { lbl.style.opacity = '0'; setTimeout(() => lbl.remove(), 300); }, 1000);
  }

  // ─── Event bus ─────────────────────────────────────────────────────────────
  window.addEventListener('ira-ghost', function(e) {
    const d = e.detail;
    if (!d) return;
    switch (d.type) {
      case 'log':    addLog(d.level || 'info', d.message);                     break;
      case 'ripple': clickRipple(d.x, d.y);                                    break;
      case 'typing': typingGlow();                                              break;
      case 'drag':   dragPath(d.fromX, d.fromY, d.toX, d.toY);               break;
      case 'scroll': scrollIndicator(d.direction, d.amount);                   break;
      case 'flash':  screenshotFlash();                                         break;
      case 'labels': labelsVisible ? hideLabels() : showLabels();              break;
    }
  });

  // ─── Element Index Labels ──────────────────────────────────────────────────
  let labelsVisible = false;
  let labelOverlays = [];

  const INTERACTIVE_SELECTOR = 'a[href], button, input, textarea, select, [role="button"], [role="link"], [role="tab"], [onclick], [tabindex]:not([tabindex="-1"])';

  function showLabels() {
    hideLabels();
    labelsVisible = true;
    const els = document.querySelectorAll(INTERACTIVE_SELECTOR);
    const visible = Array.from(els).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
    });
    visible.forEach((el, i) => {
      const badge = document.createElement('div');
      badge.className = 'ira-label-badge';
      const r = el.getBoundingClientRect();
      badge.style.cssText = \`
        position:fixed; left:\${r.left - 4}px; top:\${r.top - 14}px;
        min-width:18px; height:18px; padding:0 4px;
        background:#f97316; color:#fff; font-size:10px; font-weight:700;
        font-family:monospace; border-radius:4px; z-index:2147483640;
        display:flex; align-items:center; justify-content:center;
        pointer-events:none; box-shadow:0 2px 6px rgba(0,0,0,0.4);
        animation:iraLabelIn 0.15s ease;
      \`;
      badge.textContent = String(i + 1);
      document.body.appendChild(badge);
      labelOverlays.push(badge);
    });
    addLog('info', \`Labels shown: \${visible.length} interactive elements\`);
  }

  function hideLabels() {
    labelsVisible = false;
    labelOverlays.forEach(el => el.remove());
    labelOverlays = [];
  }

  function toggleLabels() {
    labelsVisible ? hideLabels() : showLabels();
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    if (document.getElementById(PANEL_ID)) return;
    addStyles();
    restoreLogs();
    loadState();

    const panel  = buildPanel();
    const toggle = buildToggle();
    document.body.appendChild(panel);
    document.body.appendChild(toggle);
    initResize(panel);

    // Apply saved open/closed state after DOM append
    if (!isOpen) {
      panel.setAttribute('data-open', 'false');
      toggle.style.display = 'flex';
    }

    document.getElementById('ira-close-btn')?.addEventListener('click', closePanel);
    document.getElementById('ira-clear-btn')?.addEventListener('click', clearLogs);
    document.getElementById('ira-copy-btn')?.addEventListener('click', copyLogs);

    panel.querySelectorAll('.ira-tab').forEach(tab => {
      tab.addEventListener('click', () => setFilter(tab.dataset.filter));
    });

    // Live timestamp refresh every 10s
    timeInterval = setInterval(updateTimestamps, 10000);

    // Panel floats on top — no body margin shift

    // Render restored logs
    renderLogs();
    if (panelLogs.length === 0) {
      addLog('info', 'IRA-RESEARCHER connected');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      isOpen ? closePanel() : openPanel();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      toggleLabels();
    }
  });

  // ─── Public API ────────────────────────────────────────────────────────────
  window.__iraGhost = {
    addLog,
    clickRipple,
    typingGlow,
    dragPath,
    scrollIndicator,
    screenshotFlash,
    showLabels,
    hideLabels,
    toggleLabels,
    openPanel,
    closePanel,
    clearLogs,
  };
})();
`;
}
