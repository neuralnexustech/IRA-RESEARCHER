/**
 * Pipeline — middleware wrapper for MCP tool handlers
 *
 * Provides pre/post hooks, auto-logging, timing, auto-retry,
 * and centralized error handling so individual tool functions
 * don't need duplicated try/catch + ghost calls.
 */

import { textResult, ghostLog } from "./utils.js";

// ─── Auto-Retry with Exponential Backoff ────────────────────────────────────

const RETRYABLE_ERRORS = [
  'frame was detached',
  'Target closed',
  'Navigation failed',
  'TimeoutError',
  'waitForSelector',
  'Element is not visible',
  'node is detached from the page',
];

function isRetryable(err) {
  const msg = (err.message || '').toLowerCase();
  return RETRYABLE_ERRORS.some(e => msg.includes(e.toLowerCase()));
}

export async function withRetry(fn, { maxRetries = 3, baseDelay = 1000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries && isRetryable(e)) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        console.error(`[IRA] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${e.message}`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw e;
      }
    }
  }
  throw lastErr;
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

export function createPipeline(ctx, server) {
  return {
    tool(name, description, schema, handler) {
      server.tool(name, description, schema, async (args) => {
        const start = Date.now();
        const argsStr = JSON.stringify(args).substring(0, 120);
        console.error(`[IRA] → ${name} ${argsStr}`);

        try {
          ghostLog(ctx, "thought", `Running ${name}...`);
          const result = await handler(ctx, args || {});
          const ms = Date.now() - start;
          console.error(`[IRA] ← ${name} (${ms}ms)`);
          return result;
        } catch (e) {
          const ms = Date.now() - start;
          console.error(`[IRA] ✗ ${name} (${ms}ms): ${e.message}`);
          return textResult(`${name} failed: ${e.message}`);
        }
      });
    },
  };
}
