import { textResult } from "../utils.js";

export async function wait(ctx, seconds = 3, selector) {
  try {
    if (selector) {
      const found = await ctx.page.waitForSelector(selector, { timeout: (seconds || 10) * 1000 });
      if (!found) return textResult(`Element "${selector}" not found after ${seconds || 10}s`);
      return textResult(`Element "${selector}" appeared`);
    }
    await new Promise((r) => setTimeout(r, (seconds || 3) * 1000));
    return textResult(`Waited ${seconds || 3} seconds`);
  } catch (e) {
    return textResult(`Wait failed: ${e.message}`);
  }
}

export async function scroll(ctx, direction = "down", amount = 500) {
  try {
    const allowed = ["up", "down", "left", "right"];
    if (!allowed.includes(direction)) {
      return textResult(`Invalid direction "${direction}". Use: up, down, left, right`);
    }
    const actualAmount = Math.min(amount || 500, 5000);
    const x = direction === "left" ? -actualAmount : direction === "right" ? actualAmount : 0;
    const y = direction === "up" ? -actualAmount : direction === "down" ? actualAmount : 0;
    await ctx.page.evaluate(({ x, y }) => {
      window.scrollBy({ left: x, top: y, behavior: "instant" });
    }, { x, y });
    return textResult(`Scrolled ${direction} by ${actualAmount}px`);
  } catch (e) {
    return textResult(`Scroll failed: ${e.message}`);
  }
}

export async function setViewport(ctx, width, height) {
  try {
    const cdp = ctx.page._iraCdp || ctx.cdp || ctx.page._client();
    await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
    let windowId;
    try {
      const resp = await cdp.send('Browser.getWindowForTarget');
      windowId = resp.windowId;
    } catch {}
    if (windowId) {
      await cdp.send('Browser.setWindowBounds', {
        windowId,
        bounds: { width, height, windowState: 'normal' }
      });
    }
    await ctx.page.setViewport({ width, height });
    const actual = await ctx.page.evaluate(() =>
      JSON.stringify({ outerW: window.outerWidth, outerH: window.outerHeight, innerW: window.innerWidth, innerH: window.innerHeight })
    );
    const a = JSON.parse(actual);
    const note = (a.outerW > width && a.innerW === width)
      ? ` (window min width ~${a.outerW}px on Windows; viewport correctly set to ${width}px via emulation)`
      : '';
    return textResult(`Viewport: ${a.innerW}x${a.innerH} | Window: ${a.outerW}x${a.outerH}${note}`);
  } catch (e) {
    return textResult(`Set viewport failed: ${e.message}`);
  }
}

export async function pdf(ctx, filePath) {
  try {
    const buf = await ctx.page.pdf({ format: "A4", printBackground: true });
    if (filePath) {
      const fs = await import("fs");
      fs.writeFileSync(filePath, buf);
      return textResult(`PDF saved to ${filePath} (${Math.round(buf.length / 1024)}KB)`);
    }
    return textResult(`PDF generated (${Math.round(buf.length / 1024)}KB)`);
  } catch (e) {
    return textResult(`PDF failed: ${e.message}`);
  }
}

export async function intercept(ctx, urlPattern, action) {
  try {
    if (!action || action === "passthrough") {
      await ctx.page.setRequestInterception(false);
      ctx.page.removeAllListeners("request");
      return textResult("Network interception disabled");
    }
    await ctx.page.setRequestInterception(true);
    const handler = (request) => {
      if (request.url().includes(urlPattern)) {
        if (action === "block") {
          request.abort();
        } else if (action === "mock") {
          request.respond({ status: 200, contentType: "application/json", body: "{}" });
        } else {
          request.continue();
        }
      } else {
        request.continue();
      }
    };
    ctx.page.removeAllListeners("request");
    ctx.page.on("request", handler);
    return textResult(`Interception ${action} for "${urlPattern}"`);
  } catch (e) {
    return textResult(`Interception failed: ${e.message}`);
  }
}

export async function cookies(ctx, args) {
  try {
    const { action, name, value } = args;
    if (action === "get") {
      const cookies = await ctx.page.cookies();
      return textResult(JSON.stringify(cookies, null, 2));
    } else if (action === "set") {
      if (!name) return textResult("Cookie name is required");
      await ctx.page.setCookie({ name, value: value || "", domain: new URL(ctx.page.url()).hostname });
      return textResult(`Cookie set: ${name}=${value || ""}`);
    } else if (action === "clear") {
      await ctx.page.deleteCookie(...(await ctx.page.cookies()));
      return textResult("All cookies cleared");
    }
    return textResult('Unknown action. Use: get, set, or clear');
  } catch (e) {
    return textResult(`Cookie operation failed: ${e.message}`);
  }
}
