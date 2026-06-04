/**
 * Pipeline — middleware wrapper for MCP tool handlers
 *
 * Provides pre/post hooks, auto-logging, timing, and centralized error handling
 * so individual tool functions don't need duplicated try/catch + ghost calls.
 */

import { textResult, ghostLog } from "./utils.js";

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
