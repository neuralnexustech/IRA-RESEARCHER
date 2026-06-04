import { textResult } from "../utils.js";

export async function tabs(ctx) {
  try {
    const pages = await ctx.browser.pages();
    const info = await Promise.all(
      pages.map(async (page, i) => ({
        index: i,
        url: page.url().substring(0, 100),
        title: (await page.title()).substring(0, 80),
      }))
    );
    let out = `Open tabs (${info.length}):\n\n`;
    info.forEach((t) => {
      out += `[${t.index}] ${t.title}\n    ${t.url}\n\n`;
    });
    return textResult(out);
  } catch (e) {
    return textResult(`List tabs failed: ${e.message}`);
  }
}

export async function switchTab(ctx, tabIndex) {
  try {
    const pages = await ctx.browser.pages();
    if (tabIndex < 0 || tabIndex >= pages.length) {
      return textResult(`Tab index ${tabIndex} out of range (0-${pages.length - 1})`);
    }
    ctx.page = pages[tabIndex];
    await ctx.page.bringToFront();
    const title = await ctx.page.title();
    return textResult(`Switched to tab ${tabIndex}: ${title}`);
  } catch (e) {
    return textResult(`Switch tab failed: ${e.message}`);
  }
}

export async function newTab(ctx, url) {
  try {
    const page = await ctx.browser.newPage();
    if (url) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    ctx.page = page;
    const title = url ? (await page.title() || url) : "blank";
    return textResult(`Opened new tab: ${title}`);
  } catch (e) {
    return textResult(`New tab failed: ${e.message}`);
  }
}

export async function closeTab(ctx, tabIndex) {
  try {
    const pages = await ctx.browser.pages();
    if (tabIndex < 0 || tabIndex >= pages.length) {
      return textResult(`Tab index ${tabIndex} out of range (0-${pages.length - 1})`);
    }
    if (pages.length <= 1) {
      return textResult("Cannot close the last tab");
    }
    const page = pages[tabIndex];
    const title = await page.title();
    const wasCurrent = ctx.page === page;
    await page.close();
    if (wasCurrent) {
      const remaining = await ctx.browser.pages();
      ctx.page = remaining[Math.min(tabIndex, remaining.length - 1)];
    }
    return textResult(`Closed tab ${tabIndex}: ${title}`);
  } catch (e) {
    return textResult(`Close tab failed: ${e.message}`);
  }
}
