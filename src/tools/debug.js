import { textResult } from "../utils.js";

export async function consoleLogs(ctx, args) {
  try {
    const { pattern, onlyErrors, limit = 100 } = args;
    const logs = ctx.page.__iraBuffer?.logs || [];
    let filtered = logs;
    if (onlyErrors) {
      filtered = filtered.filter((l) => l.level === "error" || l.level === "exception");
    }
    if (pattern) {
      try {
        const re = new RegExp(pattern, "i");
        filtered = filtered.filter((l) => re.test(l.text));
      } catch {
        filtered = filtered.filter((l) => l.text.includes(pattern));
      }
    }
    filtered = filtered.slice(-limit);
    if (filtered.length === 0) return textResult("No console messages" + (pattern ? ` matching "${pattern}"` : ""));
    const out = filtered.map((l) => `[${l.level}] ${l.text}`).join("\n");
    return textResult(`Console messages (${filtered.length}):\n${out}`);
  } catch (e) {
    return textResult(`Console failed: ${e.message}`);
  }
}

export async function networkRequests(ctx, args) {
  try {
    const { urlPattern, limit = 100 } = args;
    const requests = ctx.page.__iraBuffer?.requests || [];
    let filtered = requests;
    if (urlPattern) {
      filtered = filtered.filter((r) => r.url.includes(urlPattern));
    }
    filtered = filtered.slice(-limit);
    if (filtered.length === 0) return textResult("No network requests" + (urlPattern ? ` matching "${urlPattern}"` : ""));
    const out = filtered.map((r) => `${r.method} ${r.url} ${r.status ? `→ ${r.status}` : "(pending)"}`).join("\n");
    return textResult(`Network requests (${filtered.length}):\n${out}`);
  } catch (e) {
    return textResult(`Network failed: ${e.message}`);
  }
}

export async function javascript(ctx, code) {
  try {
    const result = await ctx.page.evaluate((c) => {
      try {
        const value = eval(c);
        if (value === undefined) return "undefined";
        if (value === null) return "null";
        if (typeof value === "object") return JSON.stringify(value, null, 2);
        return String(value);
      } catch (e) {
        return `Error: ${e.message}`;
      }
    }, code);
    return textResult(result.substring(0, 50000));
  } catch (e) {
    return textResult(`JavaScript execution failed: ${e.message}`);
  }
}
