/**
 * Ghost Effects — Injected into every page
 * Ported from browser-use's _DEMO_PANEL_SCRIPT with enhancements
 * 
 * Effects: floating panel, click ripple, typing glow, drag path,
 *          scroll indicators, element labels, screenshot flash
 */

export function ghostScript() {
  return `
(function() {
  if (window.__iraGhostLoaded) return;
  window.__iraGhostLoaded = true;

  const PANEL_ID = 'ira-researcher-panel';
  const TOGGLE_ID = 'ira-researcher-toggle';
  const STYLE_ID = 'ira-researcher-style';

  // ---- Styles ----
  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = \`
      #\${PANEL_ID} {
        position: fixed; top: 0; right: 0; width: 320px; height: 100vh;
        background: #05070d; color: #f8f9ff; font-family: monospace; font-size: 12px;
        box-shadow: -6px 0 25px rgba(0,0,0,0.35); z-index: 2147480000;
        border-left: 1px solid rgba(255,255,255,0.14);
        display: flex; flex-direction: column;
        transform: translateX(0); opacity: 1;
        transition: transform 0.25s ease, opacity 0.25s ease;
      }
      #\${PANEL_ID}[data-open="false"] {
        transform: translateX(110%); opacity: 0; pointer-events: none;
      }
      #\${PANEL_ID} .ira-header {
        padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.14);
        display: flex; align-items: center; justify-content: space-between;
      }
      #\${PANEL_ID} .ira-header h1 { font-size: 14px; margin: 0; color: #f97316; }
      #\${PANEL_ID} .ira-counter { font-size: 11px; color: #888; }
      #\${PANEL_ID} .ira-close {
        width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
        background: transparent; color: #fff; cursor: pointer; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
      }
      #\${PANEL_ID} .ira-close:hover { background: rgba(255,255,255,0.1); }
      #\${PANEL_ID} .ira-body { flex: 1; overflow-y: auto; padding: 4px 0; }
      .ira-entry {
        display: flex; gap: 8px; padding: 6px 12px;
        border-left: 2px solid transparent; border-bottom: 1px solid rgba(255,255,255,0.04);
        animation: iraFadeIn 0.2s ease;
      }
      .ira-entry.level-action { border-left-color: #34d399; }
      .ira-entry.level-success { border-left-color: #22c55e; }
      .ira-entry.level-thought { border-left-color: #f97316; }
      .ira-entry.level-error { border-left-color: #f87171; }
      .ira-entry-icon { font-size: 13px; width: 16px; }
      .ira-entry-text { flex: 1; color: #f8f9ff; font-size: 11px; word-break: break-word; }
      .ira-entry-time { font-size: 10px; color: #666; white-space: nowrap; }
      @keyframes iraFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes clickRipple {
        0% { transform: scale(0.5); opacity: 0.8; }
        100% { transform: scale(3); opacity: 0; }
      }
      @keyframes typingPulse {
        0%, 100% { box-shadow: 0 0 5px rgba(34,197,94,0.3); }
        50% { box-shadow: 0 0 15px rgba(34,197,94,0.5); }
      }
      #\${TOGGLE_ID} {
        position: fixed; top: 16px; right: 16px; width: 36px; height: 36px;
        border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
        background: rgba(5,7,13,0.92); color: #f97316;
        font-size: 16px; cursor: pointer; z-index: 2147480001;
        display: none; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      }
      #\${TOGGLE_ID}:hover { transform: scale(1.05); }
    \`;
    document.head.appendChild(style);
  }

  // ---- Panel ----
  let panelLogs = [];
  let isOpen = true;

  function buildPanel() {
    const panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.setAttribute('data-open', 'true');
    panel.innerHTML = \`
      <div class="ira-header">
        <h1>🤖 IRA-RESEARCHER</h1>
        <span class="ira-counter" id="ira-counter">0</span>
        <button class="ira-close" id="ira-close-btn">&times;</button>
      </div>
      <div class="ira-body" id="ira-log-list"></div>
    \`;
    return panel;
  }

  function buildToggle() {
    const btn = document.createElement('button');
    btn.id = TOGGLE_ID;
    btn.textContent = '🤖';
    btn.addEventListener('click', () => openPanel());
    return btn;
  }

  function openPanel() {
    isOpen = true;
    const panel = document.getElementById(PANEL_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (panel) panel.setAttribute('data-open', 'true');
    if (toggle) toggle.style.display = 'none';
  }

  function closePanel() {
    isOpen = false;
    const panel = document.getElementById(PANEL_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (panel) panel.setAttribute('data-open', 'false');
    if (toggle) toggle.style.display = 'flex';
  }

  function addLog(level, message) {
    panelLogs.push({ level, message, time: Date.now() });
    if (panelLogs.length > 100) panelLogs.shift();
    const list = document.getElementById('ira-log-list');
    const counter = document.getElementById('ira-counter');
    if (!list || !counter) return;
    counter.textContent = panelLogs.length;
    const entry = document.createElement('div');
    entry.className = 'ira-entry level-' + level;
    const icons = { action: '▶️', info: 'ℹ️', thought: '💭', success: '✅', error: '❌' };
    entry.innerHTML = \`
      <span class="ira-entry-icon">\${icons[level] || 'ℹ️'}</span>
      <span class="ira-entry-text">\${message}</span>
      <span class="ira-entry-time">just now</span>
    \`;
    list.appendChild(entry);
    list.scrollTop = list.scrollHeight;
  }

  // ---- Click Ripple ----
  function clickRipple(x, y) {
    const dot = document.createElement('div');
    dot.style.cssText = \`
      position: fixed; left: \${x - 15}px; top: \${y - 15}px;
      width: 30px; height: 30px; border-radius: 50%;
      background: rgb(249, 115, 22); opacity: 0.6;
      pointer-events: none; z-index: 2147483647;
      animation: clickRipple 0.5s ease-out forwards;
    \`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 600);

    // Coordinate label
    const label = document.createElement('div');
    label.style.cssText = \`
      position: fixed; left: \${x + 12}px; top: \${y - 12}px;
      padding: 2px 6px; background: rgba(0,0,0,0.7); color: #f97316;
      font-size: 10px; font-family: monospace; border-radius: 3px;
      pointer-events: none; z-index: 2147483647;
      opacity: 0; transition: opacity 0.3s ease;
    \`;
    label.textContent = \`(\${Math.round(x)}, \${Math.round(y)})\`;
    document.body.appendChild(label);
    requestAnimationFrame(() => label.style.opacity = '1');
    setTimeout(() => { label.style.opacity = '0'; setTimeout(() => label.remove(), 300); }, 1200);
  }

  // ---- Typing Glow ----
  function typingGlow() {
    const active = document.activeElement;
    if (!active) return;
    const origBoxShadow = active.style.boxShadow;
    active.style.boxShadow = '0 0 15px rgba(34,197,94,0.5)';
    active.style.transition = 'box-shadow 0.3s ease';
    setTimeout(() => { active.style.boxShadow = origBoxShadow || 'none'; }, 1500);
  }

  // ---- Drag Path ----
  function dragPath(fromX, fromY, toX, toY) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', \`
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 2147483646;
    \`);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    marker.innerHTML = '<polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />';
    defs.appendChild(marker);
    svg.appendChild(defs);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
    line.setAttribute('x1', fromX);
    line.setAttribute('y1', fromY);
    line.setAttribute('x2', toX);
    line.setAttribute('y2', toY);
    line.setAttribute('stroke', '#ef4444');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '8,4');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(line);
    document.body.appendChild(svg);
    setTimeout(() => svg.remove(), 1500);
  }

  // ---- Scroll Indicator ----
  function scrollIndicator(direction, amount) {
    const el = document.createElement('div');
    const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : direction === 'left' ? '←' : '→';
    el.style.cssText = \`
      position: fixed; \${direction === 'up' || direction === 'down' ? 'right: 30px;' : 'bottom: 50%; transform: translateY(50%);'}
      \${direction === 'up' ? 'top: 20px;' : direction === 'down' ? 'bottom: 20px;' : ''}
      \${direction === 'left' ? 'left: 20px;' : direction === 'right' ? 'right: 20px;' : ''}
      padding: 8px 16px; background: rgba(0,0,0,0.6); color: #f97316;
      font-size: 24px; font-family: monospace; border-radius: 8px;
      pointer-events: none; z-index: 2147483647;
      opacity: 1; transition: opacity 0.5s ease;
    \`;
    el.textContent = \`\${arrow} \${Math.round(amount)}px\`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 1000);
  }

  // ---- Screenshot Flash ----
  function screenshotFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = \`
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: white; opacity: 0; pointer-events: none; z-index: 2147483647;
      animation: iraFadeIn 0.1s ease forwards;
    \`;
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.transition = 'opacity 0.3s ease';
      flash.style.opacity = '0.2';
      setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 300); }, 100);
    });
    const label = document.createElement('div');
    label.style.cssText = \`
      position: fixed; top: 20px; right: 60px; padding: 4px 10px;
      background: rgba(0,0,0,0.6); color: #fff; font-size: 14px; border-radius: 6px;
      pointer-events: none; z-index: 2147483647; opacity: 0; transition: opacity 0.3s ease;
    \`;
    label.textContent = '📸 Screenshot';
    document.body.appendChild(label);
    requestAnimationFrame(() => label.style.opacity = '1');
    setTimeout(() => { label.style.opacity = '0'; setTimeout(() => label.remove(), 300); }, 1000);
  }

  // ---- Listen for custom events from Puppeteer ----
  window.addEventListener('ira-ghost', function(e) {
    const detail = e.detail;
    if (!detail) return;
    switch (detail.type) {
      case 'log': addLog(detail.level || 'info', detail.message); break;
      case 'ripple': clickRipple(detail.x, detail.y); break;
      case 'typing': typingGlow(); break;
      case 'drag': dragPath(detail.fromX, detail.fromY, detail.toX, detail.toY); break;
      case 'scroll': scrollIndicator(detail.direction, detail.amount); break;
      case 'flash': screenshotFlash(); break;
    }
  });

  // ---- Keyboard shortcut to toggle ----
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      if (isOpen) closePanel(); else openPanel();
    }
  });

  // ---- Init ----
  function init() {
    if (document.getElementById(PANEL_ID)) return;
    addStyles();
    document.body.appendChild(buildPanel());
    document.body.appendChild(buildToggle());
    document.getElementById('ira-close-btn')?.addEventListener('click', closePanel);
    addLog('info', 'IRA-RESEARCHER connected');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Expose API ----
  window.__iraGhost = {
    addLog,
    clickRipple,
    typingGlow,
    dragPath,
    scrollIndicator,
    screenshotFlash,
  };
})();
`;
}