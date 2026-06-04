/**
 * Browser launcher with stealth mode and proxy support.
 * Uses puppeteer-extra with stealth plugin for anti-detection.
 */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerVanilla from "puppeteer";
import { ghostScript } from "./ghost/index.js";

puppeteer.use(StealthPlugin());

/**
 * Pick a random proxy from comma-separated list
 */
function pickProxy(proxyEnv) {
  if (!proxyEnv || proxyEnv.trim() === "") return null;
  const rotate = process.env.IRA_PROXY_ROTATE === "true";
  const proxies = proxyEnv.split(",").map((p) => p.trim()).filter(Boolean);
  if (proxies.length === 0) return null;
  if (!rotate || proxies.length === 1) return proxies[0];
  const picked = proxies[Math.floor(Math.random() * proxies.length)];
  console.error(`[IRA] Auto-rotated proxy: ${picked} (from ${proxies.length} proxies)`);
  return picked;
}

/**
 * Launch browser with stealth + optional proxy
 */
export async function launchBrowser() {
  const headless = process.env.IRA_HEADLESS !== "false";
  const ghost = process.env.IRA_GHOST !== "false";
  const debug = process.env.IRA_DEBUG === "true";
  const proxy = pickProxy(process.env.IRA_PROXY);

  console.error(`[IRA] Launching browser (headless: ${headless}, ghost: ${ghost}, debug: ${debug})`);

  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1920,1032",
    "--window-position=0,0",
  ];

  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: !!headless,
      args,
      defaultViewport: null,
    });
    const pid = browser.process()?.pid ?? "unknown";
    console.error(`[IRA] Browser launched with stealth mode — PID: ${pid}, visible: ${!headless}`);
    // Force window to front via CDP
    try {
      const pages = await browser.pages();
      if (pages.length > 0) {
        const cdp = await pages[0].target().createCDPSession();
        await cdp.send('Browser.setWindowBounds', {
          windowId: (await cdp.send('Browser.getWindowForTarget')).windowId,
          bounds: { windowState: 'normal' }
        });
        await cdp.detach();
      }
    } catch (e) {
      console.error("[IRA] Failed to bring window to front:", e.message);
    }
  } catch (e) {
    console.error("[IRA] Stealth launch failed, trying vanilla puppeteer:", e.message);
    browser = await puppeteerVanilla.launch({
      headless: !!headless,
      args,
      defaultViewport: null,
    });
    const pid = browser.process()?.pid ?? "unknown";
    console.error(`[IRA] Browser launched (vanilla mode) — PID: ${pid}, visible: ${!headless}`);
    try {
      const pages = await browser.pages();
      if (pages.length > 0) {
        const cdp = await pages[0].target().createCDPSession();
        await cdp.send('Browser.setWindowBounds', {
          windowId: (await cdp.send('Browser.getWindowForTarget')).windowId,
          bounds: { windowState: 'normal' }
        });
        await cdp.detach();
      }
    } catch (e) {
      console.error("[IRA] Failed to bring window to front:", e.message);
    }
  }

  async function setupPageTracking(page) {
    // Inject ghost + console/network init into every page
    await page.evaluateOnNewDocument(ghostScript());

    // Node-side buffers — survive navigation, no round-trips
    const buffer = { logs: [], requests: [] };
    page.__iraBuffer = buffer;

    const cdp = await page.target().createCDPSession();

    await cdp.send("Runtime.enable");
    cdp.on("Runtime.consoleAPICalled", (msg) => {
      try {
        const text = msg.args.map((a) => a.value ?? "").join(" ").substring(0, 500);
        buffer.logs.push({ level: msg.type, text, time: Date.now() });
        if (buffer.logs.length > 1000) buffer.logs.shift();
      } catch (err) {
        console.error("[IRA] CDP console handler error:", err.message);
      }
    });

    await cdp.send("Network.enable");
    cdp.on("Network.requestWillBeSent", (msg) => {
      try {
        buffer.requests.push({
          url: msg.request.url,
          method: msg.request.method,
          requestId: msg.requestId,
          time: Date.now(),
        });
        if (buffer.requests.length > 500) buffer.requests.shift();
      } catch (err) {
        console.error("[IRA] CDP network handler error:", err.message);
      }
    });
    cdp.on("Network.responseReceived", (msg) => {
      try {
        const reqs = buffer.requests;
        for (let i = reqs.length - 1; i >= 0; i--) {
          if (reqs[i].requestId === msg.requestId) {
            reqs[i].status = msg.response.status;
            reqs[i].url = msg.response.url;
            break;
          }
        }
      } catch (err) {
        console.error("[IRA] CDP network response handler error:", err.message);
      }
    });

    // Cleanup CDP session on page close
    page.on("close", () => {
      try { cdp.detach(); } catch {}
    });

    // Page lifecycle logging
    page.on("domcontentloaded", () => {
      const u = page.url().substring(0, 120);
      console.error(`[IRA] Page DOM ready: ${u}`);
    });
    page.on("load", () => {
      const u = page.url().substring(0, 120);
      console.error(`[IRA] Page fully loaded: ${u}`);
    });

    if (debug) {
      page.on("console", (msg) => console.error(`[IRA-CONSOLE] [${msg.type()}] ${msg.text()}`));
    }
    return cdp;
  }

  // Track existing pages and capture first page's CDP session
  const pages = await browser.pages();
  let firstCdp;
  await Promise.all(pages.map(async (p) => {
    const cdp = await setupPageTracking(p);
    if (!firstCdp) firstCdp = cdp;
  }));

  // Track new pages (only real pages, not service workers or extensions)
  browser.on("targetcreated", (target) => {
    if (target.type() !== "page") return;
    (async () => {
      try {
        const page = await target.page();
        if (page) await setupPageTracking(page);
      } catch (err) {
        console.error("[IRA] Failed to setup tracking on new page:", err.message);
      }
    })();
  });

  return { browser, cdp: firstCdp };
}
