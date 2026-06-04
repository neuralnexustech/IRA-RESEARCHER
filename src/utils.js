/**
 * Shared utilities for IRA-RESEARCHER
 */

export function textResult(text) {
  return { content: [{ type: "text", text }] };
}

export function imageContent(data, mimeType = "image/png") {
  return { type: "image", data, mimeType };
}

export function imageResult(base64) {
  return { content: [imageContent(base64)] };
}

export async function ghostLog(ctx, level, message) {
  if (!ctx?.ghost || !ctx?.page) return;
  try {
    await ctx.page.evaluate(({ level, message }) => {
      window.__iraGhost?.addLog(level, message);
    }, { level, message });
  } catch (err) {
    console.error("[IRA] ghostLog error:", err.message);
  }
}

export async function ghostRipple(ctx, x, y) {
  if (!ctx?.ghost || !ctx?.page) return;
  try {
    await ctx.page.evaluate(({ x, y }) => {
      window.__iraGhost?.clickRipple(x, y);
    }, { x, y });
  } catch (err) {
    console.error("[IRA] ghostRipple error:", err.message);
  }
}

export async function ghostTypingGlow(ctx) {
  if (!ctx?.ghost || !ctx?.page) return;
  try {
    await ctx.page.evaluate(() => {
      window.__iraGhost?.typingGlow();
    });
  } catch (err) {
    console.error("[IRA] ghostTypingGlow error:", err.message);
  }
}

export async function ghostFlash(ctx) {
  if (!ctx?.ghost || !ctx?.page) return;
  try {
    await ctx.page.evaluate(() => window.__iraGhost?.screenshotFlash());
  } catch (err) {
    console.error("[IRA] ghostFlash error:", err.message);
  }
}

export async function ghostDrag(ctx, fromX, fromY, toX, toY) {
  if (!ctx?.ghost || !ctx?.page) return;
  try {
    await ctx.page.evaluate(({ fromX, fromY, toX, toY }) => {
      window.__iraGhost?.dragPath(fromX, fromY, toX, toY);
    }, { fromX, fromY, toX, toY });
  } catch (err) {
    console.error("[IRA] ghostDrag error:", err.message);
  }
}

export async function ghostScroll(ctx, direction, amount) {
  if (!ctx?.ghost || !ctx?.page) return;
  try {
    await ctx.page.evaluate(({ direction, amount }) => {
      window.__iraGhost?.scrollIndicator(direction, amount);
    }, { direction, amount });
  } catch (err) {
    console.error("[IRA] ghostScroll error:", err.message);
  }
}

export function prettyJSON(obj, maxLength = 50000) {
  const str = JSON.stringify(obj, null, 2);
  return str.length > maxLength ? str.substring(0, maxLength) + "\n... (truncated)" : str;
}

export function truncate(str, maxLen = 80) {
  if (!str) return "";
  return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
}