import { textResult } from "../utils.js";

const startTime = Date.now();

// ─── Page Health Patterns ───────────────────────────────────────────────────

const ERROR_PATTERNS = [
  { pattern: /403|forbidden|access.denied/i, type: "blocked", desc: "Access forbidden (403)" },
  { pattern: /404|not.found/i, type: "not_found", desc: "Page not found (404)" },
  { pattern: /500|internal.server.error/i, type: "server_error", desc: "Server error (500)" },
  { pattern: /502|503|504|bad.gateway|service.unavailable|gateway.timeout/i, type: "service_down", desc: "Service unavailable" },
  { pattern: /captcha|verify.you.are.human|robot|challenge/i, type: "captcha", desc: "CAPTCHA detected" },
  { pattern: /cloudflare|cf-browser-verification/i, type: "cloudflare", desc: "Cloudflare challenge" },
  { pattern: /rate.limit|too.many.requests|429/i, type: "rate_limited", desc: "Rate limited (429)" },
  { pattern: /connection.refused|ERR_CONNECTION/i, type: "connection_refused", desc: "Connection refused" },
  { pattern: /timeout|timed.out/i, type: "timeout", desc: "Page timeout" },
];

const LOADING_PATTERNS = [
  { pattern: /loading|spinner|skeleton|skeleton-screen/i, type: "loading", desc: "Loading indicator present" },
];

async function checkPageHealth(page) {
  try {
    const health = await page.evaluate(({ errorPatterns, loadingPatterns }) => {
      const body = document.body?.innerText || '';
      const html = document.documentElement?.innerHTML || '';
      const text = body + ' ' + html;

      // Check document.readyState
      const readyState = document.readyState;

      // Check for error patterns
      for (const { pattern, type, desc } of errorPatterns) {
        if (new RegExp(pattern, 'i').test(text)) {
          return { status: 'error', type, desc, readyState };
        }
      }

      // Check for loading patterns
      for (const { pattern, type, desc } of loadingPatterns) {
        if (new RegExp(pattern, 'i').test(text)) {
          return { status: 'loading', type, desc, readyState };
        }
      }

      // Check for very short content (likely empty/broken page)
      if (body.trim().length < 50 && readyState === 'complete') {
        return { status: 'warning', type: 'empty_page', desc: 'Page content is very short', readyState };
      }

      return { status: 'healthy', type: 'ok', desc: 'Page loaded successfully', readyState };
    }, { errorPatterns: ERROR_PATTERNS, loadingPatterns: LOADING_PATTERNS });

    return health;
  } catch (e) {
    return { status: 'unknown', type: 'check_failed', desc: e.message, readyState: 'unknown' };
  }
}

export async function health(ctx) {
  try {
    const browser = ctx.browser;
    const page = ctx.page;
    const browserConnected = browser?.connected ?? false;

    let pages = [];
    let pageCount = 0;
    let currentUrl = "";
    let currentTitle = "";
    let readyState = "";
    let cdpConnected = false;
    let ghostActive = false;
    let pageHealth = null;

    if (browserConnected) {
      try {
        pages = await browser.pages();
        pageCount = pages.length;
      } catch {}
    }

    if (page) {
      try {
        currentUrl = page.url() || "";
        currentTitle = (await page.title()) || "";
        readyState = await page.evaluate(() => document.readyState).catch(() => "");
        cdpConnected = !!(ctx.cdp || page._client());
        ghostActive = await page.evaluate(() => !!window.__iraGhost).catch(() => false);
        pageHealth = await checkPageHealth(page);
      } catch {}
    }

    const uptime = Math.round((Date.now() - startTime) / 1000);

    const report = {
      status: browserConnected ? "connected" : "disconnected",
      uptime: `${uptime}s`,
      browser: {
        connected: browserConnected,
        pid: browser?.process?.pid ?? null,
        pagesOpen: pageCount,
      },
      currentPage: {
        url: currentUrl || "(none)",
        title: currentTitle || "(none)",
        readyState: readyState || "(unknown)",
        cdpConnected,
        ghostPanel: ghostActive,
      },
    };

    if (pageHealth) {
      report.pageHealth = pageHealth;
    }

    if (!browserConnected) {
      report.browser.error = "Browser process not running or not connected";
    }

    return textResult(JSON.stringify(report, null, 2));
  } catch (e) {
    return textResult(`Health check failed: ${e.message}`);
  }
}
