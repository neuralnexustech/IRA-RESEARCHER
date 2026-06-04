import { textResult } from "../utils.js";

const startTime = Date.now();

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
      } catch {}
    }

    const uptime = Math.round((Date.now() - startTime) / 1000);

    const report = {
      status: browserConnected ? "connected" : "disconnected",
      uptime: `${uptime}s`,
      browser: {
        connected: browserConnected,
        pid: browser?.process()?.pid ?? null,
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

    if (!browserConnected) {
      report.browser.error = "Browser process not running or not connected";
    }

    return textResult(JSON.stringify(report, null, 2));
  } catch (e) {
    return textResult(`Health check failed: ${e.message}`);
  }
}
