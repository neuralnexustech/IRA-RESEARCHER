/**
 * Browser launcher — launches Chrome directly via PowerShell Start-Process,
 * then connects Puppeteer via CDP. Bypasses Puppeteer's launch mechanism
 * which has been creating invisible windows (MainWindowHandle=0).
 *
 * ROOT CAUSE:
 *   Puppeteer's launch on Windows (even plain puppeteer 23) creates Chrome
 *   instances with MainWindowHandle=0 — no visible window handle. Using
 *   PowerShell Start-Process with -WindowStyle Maximized gives Chrome a
 *   proper Windows GUI window handle from the start.
 *
 * ENV VARS:
 *   IRA_HEADLESS=false     → show Chrome window (default: hidden)
 *   IRA_WINDOW=maximize    → "maximize" | "1280x800" | "auto"
 *   IRA_GHOST=false        → disable ghost overlay
 *   IRA_DEBUG=true         → verbose console logs
 *   IRA_PROXY=http://...   → proxy URL(s), comma-separated
 *   IRA_PROXY_ROTATE=true  → randomly rotate proxies
 */

import puppeteer from "puppeteer";
import { execSync, exec } from "child_process";
import fs from "fs";
import { ghostScript } from "./ghost/index.js";

// ─── Stealth evasions via CDP ───────────────────────────────────────────────────

const STEALTH_SCRIPT = `
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', {
  get: () => [
    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
  ].filter(Boolean),
});
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
const origQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (p) => p.name === 'notifications' ? Promise.resolve({ state: 'denied' }) : origQuery(p);
try { const c = new CanvasRenderingContext2D(); } catch(e) {}
Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
`;

// ─── Screen size detection ────────────────────────────────────────────────────

async function getScreenSize() {
  const fallback = { width: 1280, height: 800 };
  try {
    if (process.platform === "win32") {
      const out = execSync(
        `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $s=[System.Windows.Forms.Screen]::PrimaryScreen; Write-Output \\\"$($s.WorkingArea.Width) $($s.WorkingArea.Height)\\\""`,
        { timeout: 5000 }
      ).toString().trim();
      const [w, h] = out.split(" ").map(Number);
      if (w > 0 && h > 0) {
        console.error(`[IRA] Screen work area: ${w}×${h}`);
        return { width: w, height: h };
      }
    } else if (process.platform === "darwin") {
      const out = execSync("osascript -e 'tell app \"Finder\" to get bounds of window of desktop'", { timeout: 5000 }).toString().trim();
      const parts = out.split(",").map(s => parseInt(s.trim(), 10));
      if (parts.length === 4) {
        return { width: parts[2] - parts[0], height: parts[3] - parts[1] };
      }
    }
  } catch (e) {
    console.error("[IRA] Screen detection failed:", e.message);
  }
  return fallback;
}

function resolveWindowMode(screen) {
  const raw = (process.env.IRA_WINDOW || "auto").toLowerCase().trim();
  if (raw === "maximize") return { mode: "maximize", width: screen.width, height: screen.height };
  const m = raw.match(/^(\d+)[x×](\d+)$/);
  if (m) return { mode: "fixed", width: Math.min(+m[1], screen.width), height: Math.min(+m[2], screen.height) };
  return { mode: "auto", width: screen.width, height: screen.height };
}

// ─── Windows foreground fix ───────────────────────────────────────────────────

function forceWindowToFront(chromePid) {
  if (process.platform !== "win32") return;
  const psScript = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class WinHelper {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool AllowSetForegroundWindow(uint pid);
}
'@
$pid = ${chromePid}
[WinHelper]::AllowSetForegroundWindow($pid) | Out-Null
Start-Sleep -Milliseconds 800
$procs = Get-Process -Name chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
foreach ($p in $procs) {
  $h = $p.MainWindowHandle
  [WinHelper]::ShowWindow($h, 9) | Out-Null
  [WinHelper]::BringWindowToTop($h) | Out-Null
  [WinHelper]::SetForegroundWindow($h) | Out-Null
  Write-Host "Focused PID $($p.Id) HWND $h"
}
if (-not $procs) { Write-Host "No Chrome window handle found yet" }
`;

  const tmpFile = `${process.env.TEMP || "C:\\Windows\\Temp"}\\ira_focus_${Date.now()}.ps1`;
  try {
    fs.writeFileSync(tmpFile, psScript, "utf8");
    exec(`powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 10000 },
      (err, stdout) => {
        try { fs.unlinkSync(tmpFile); } catch {}
        if (err) console.error("[IRA] forceWindowToFront error:", err.message);
        else if (stdout.trim()) console.error("[IRA] forceWindowToFront:", stdout.trim());
      }
    );
  } catch (e) {
    console.error("[IRA] forceWindowToFront setup failed:", e.message);
  }
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

function pickProxy(proxyEnv) {
  if (!proxyEnv || proxyEnv.trim() === "") return null;
  const rotate = process.env.IRA_PROXY_ROTATE === "true";
  const proxies = proxyEnv.split(",").map(p => p.trim()).filter(Boolean);
  if (proxies.length === 0) return null;
  if (!rotate || proxies.length === 1) return proxies[0];
  return proxies[Math.floor(Math.random() * proxies.length)];
}

// ─── Main launch ──────────────────────────────────────────────────────────────

export async function launchBrowser() {
  const headless = process.env.IRA_HEADLESS !== "false";
  const ghost    = process.env.IRA_GHOST !== "false";
  const debug    = process.env.IRA_DEBUG === "true";
  const proxy    = pickProxy(process.env.IRA_PROXY);

  console.error(headless
    ? "[IRA] ⚠️  HEADLESS mode"
    : "[IRA] ✅  HEADED mode — Chrome window will be visible."
  );

  const screen = await getScreenSize();
  const win    = resolveWindowMode(screen);
  console.error(`[IRA] Window: ${win.mode} → ${win.width}×${win.height} (detected screen: ${screen.width}×${screen.height})`);

  // Find Chrome executable path
  let chromePath;
  try {
    chromePath = puppeteer.executablePath();
  } catch {
    // Fallback: use system Chrome
    chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }
  console.error(`[IRA] Chrome binary: ${chromePath}`);

  // Build Chrome args
  const chromeArgs = [
    "--no-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--remote-debugging-port=9222",
    "--disable-background-networking",
    "--disable-infobars",
    "--disable-features=ChromeWhatsNewUI,ChromeForTestingAutoLaunch,EnableAutomation",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=" + (process.env.TEMP || "C:\\Windows\\Temp") + "\\ira_profile_" + Date.now(),
  ];

  if (win.mode === "maximize") {
    chromeArgs.push("--start-maximized");
  } else {
    chromeArgs.push(`--window-size=${win.width},${win.height}`, "--window-position=0,0");
  }

  if (proxy) chromeArgs.push(`--proxy-server=${proxy}`);

  // ══════════════════════════════════════════════════════
  // LAUNCH: PowerShell Start-Process (not Puppeteer launch)
  // ══════════════════════════════════════════════════════
  // This is the critical fix: PowerShell creates the process with
  // a proper foreground token, giving Chrome a real MainWindowHandle.
  const argsStr = chromeArgs.join(" ");
  const psLaunch = `Start-Process -FilePath "${chromePath}" -ArgumentList '${argsStr}' -WindowStyle ${win.mode === "maximize" ? "Maximized" : "Normal"}`;

  console.error(`[IRA] Launching via PowerShell: ${psLaunch}`);

  let chromePid;
  try {
    const psOut = execSync(
      `powershell -NoProfile -WindowStyle Hidden -Command "${psLaunch}; Start-Sleep -Seconds 2; (Get-Process chrome | Sort-Object StartTime -Descending | Select-Object -First 1).Id"`,
      { timeout: 15000 }
    ).toString().trim();
    chromePid = parseInt(psOut, 10);
    console.error(`[IRA] Chrome launched via PowerShell — PID: ${chromePid}`);
  } catch (e) {
    throw new Error(`[IRA] PowerShell Chrome launch failed: ${e.message}`);
  }

  // ─── Connect Puppeteer to the running Chrome instance ─────────────────────
  let browser;
  let retries = 0;
  while (retries < 15) {
    try {
      browser = await puppeteer.connect({
        browserURL: "http://127.0.0.1:9222",
        defaultViewport: null,
      });
      console.error(`[IRA] Puppeteer connected to Chrome (PID ${chromePid})`);
      break;
    } catch (e) {
      retries++;
      if (retries >= 15) throw new Error(`[IRA] Failed to connect: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Windows foreground fix
  if (!headless && process.platform === "win32") {
    await new Promise(r => setTimeout(r, 2000));
    forceWindowToFront(chromePid);
  }

  // ─── Page tracking setup ──────────────────────────────────────────────────

  const STEALTH_RUNNER = `(function() { ${STEALTH_SCRIPT} })();`;

  async function setupPageTracking(page) {
    // Inject stealth + ghost
    await page.evaluateOnNewDocument(STEALTH_RUNNER);
    await page.evaluateOnNewDocument(ghostScript());

    const buffer = { logs: [], requests: [] };
    page.__iraBuffer = buffer;

    const cdp = await page.target().createCDPSession();

    await cdp.send("Runtime.enable");
    cdp.on("Runtime.consoleAPICalled", (msg) => {
      try {
        const text = msg.args.map(a => a.value ?? "").join(" ").substring(0, 500);
        buffer.logs.push({ level: msg.type, text, time: Date.now() });
        if (buffer.logs.length > 1000) buffer.logs.shift();
      } catch (err) { console.error("[IRA] CDP console error:", err.message); }
    });

    await cdp.send("Network.enable");
    cdp.on("Network.requestWillBeSent", (msg) => {
      try {
        buffer.requests.push({ url: msg.request.url, method: msg.request.method, requestId: msg.requestId, time: Date.now() });
        if (buffer.requests.length > 500) buffer.requests.shift();
      } catch (err) { console.error("[IRA] CDP network error:", err.message); }
    });
    cdp.on("Network.responseReceived", (msg) => {
      try {
        const reqs = buffer.requests;
        for (let i = reqs.length - 1; i >= 0; i--) {
          if (reqs[i].requestId === msg.requestId) { reqs[i].status = msg.response.status; reqs[i].url = msg.response.url; break; }
        }
      } catch (err) { console.error("[IRA] CDP response error:", err.message); }
    });

    page.on("close", () => { try { cdp.detach(); } catch {} });
    page.on("domcontentloaded", () => console.error(`[IRA] DOM ready: ${page.url().substring(0, 120)}`));
    page.on("load", () => console.error(`[IRA] Page loaded: ${page.url().substring(0, 120)}`));
    if (debug) page.on("console", msg => console.error(`[IRA-CONSOLE] [${msg.type()}] ${msg.text()}`));
    return cdp;
  }

  const startUrl = process.env.IRA_START_URL || "https://www.neuralnexustech.com/";

  const pages = await browser.pages();
  let firstCdp;
  await Promise.all(pages.map(async (p) => {
    const cdp = await setupPageTracking(p);
    if (!firstCdp) firstCdp = cdp;
  }));

  // Navigate first page to start URL
  if (pages.length > 0 && pages[0].url() === "about:blank") {
    try {
      await pages[0].goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      console.error(`[IRA] Navigated to start URL: ${startUrl}`);
    } catch (e) {
      console.error(`[IRA] Start navigation failed: ${e.message}`);
    }
  }

  browser.on("targetcreated", (target) => {
    if (target.type() !== "page") return;
    (async () => {
      try {
        const page = await target.page();
        if (page) await setupPageTracking(page);
      } catch (err) { console.error("[IRA] Setup tracking on new page failed:", err.message); }
    })();
  });

  // ─── Auto-Recovery on Crash ───────────────────────────────────────────────

  let recoveryCallback = null;

  browser.on("disconnected", () => {
    console.error("[IRA] ⚠️  Browser disconnected — auto-recovery will trigger");
    if (recoveryCallback) {
      recoveryCallback();
    }
  });

  function onCrash(callback) {
    recoveryCallback = callback;
  }

  return { browser, cdp: firstCdp, onCrash };
}
