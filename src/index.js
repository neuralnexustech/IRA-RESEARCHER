#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { launchBrowser, shutdownBrowser, listInstances, killInstance } from "./browser.js";
import { createPipeline } from "./pipeline.js";
import * as nav from "./tools/navigation.js";
import * as interact from "./tools/interaction.js";
import * as vision from "./tools/vision.js";
import * as reading from "./tools/reading.js";
import * as tabs from "./tools/tabs.js";
import * as debug from "./tools/debug.js";
import * as devtools from "./tools/devtools.js";
import * as utility from "./tools/utility.js";
import * as status from "./tools/status.js";

process.env.PUPPETEER_LOGLEVEL = "error";

process.on("unhandledRejection", (err) => {
  console.error("[IRA] Unhandled rejection:", err?.message || err);
});
process.on("uncaughtException", (err) => {
  console.error("[IRA] Uncaught exception:", err?.message || err);
});

// ─── Auto-Recovery State ────────────────────────────────────────────────────

let recoveryInProgress = false;
let browserInstance = null;

async function main() {
  let { browser, cdp } = await launchBrowser();
  browserInstance = browser;
  let pages = await browser.pages();
  let page = pages[0] || await browser.newPage();
  let ctx = { browser, page, cdp, ghost: true };

  // ─── Auto-Recovery Handler ──────────────────────────────────────────────
  browser.on("disconnected", async () => {
    if (recoveryInProgress) return;
    recoveryInProgress = true;
    console.error("[IRA] Browser disconnected — auto-recovery starting...");

    try {
      await new Promise((r) => setTimeout(r, 2000));
      const result = await launchBrowser();
      browser = result.browser;
      browserInstance = browser;
      cdp = result.cdp;
      pages = await browser.pages();
      page = pages[0] || await browser.newPage();

      ctx.browser = browser;
      ctx.page = page;
      ctx.cdp = cdp;

      console.error("[IRA] Auto-recovery complete — browser restarted");
      recoveryInProgress = false;
    } catch (e) {
      console.error("[IRA] Auto-recovery failed:", e.message);
      recoveryInProgress = false;
    }
  });

  const server = new McpServer({ name: "ira-researcher", version: "2.0.0" });
  const api = createPipeline(ctx, server);

  // ─── Navigation (4) ─────────────────────────────────────────────────────
  api.tool("ira_navigate", "Navigate to a URL with auto-retry on empty DOM", {
    url: z.string().describe("The URL to navigate to"),
  }, (ctx, { url }) => nav.navigate(ctx, url));

  api.tool("ira_go_back", "Go back in browser history", {}, (ctx) => nav.goBack(ctx));
  api.tool("ira_go_forward", "Go forward in browser history", {}, (ctx) => nav.goForward(ctx));
  api.tool("ira_reload", "Reload the current page", {}, (ctx) => nav.reload(ctx));

  // ─── Interaction (7) ────────────────────────────────────────────────────
  api.tool("ira_click", "Click by index or coordinates", {
    index: z.number().optional().describe("Element index from ira_get_state"),
    x: z.number().optional().describe("X coordinate"),
    y: z.number().optional().describe("Y coordinate"),
  }, (ctx, args) => interact.click(ctx, args));

  api.tool("ira_type", "Type text into an input field", {
    index: z.number().describe("Element index from ira_get_state"),
    text: z.string().describe("Text to type"),
  }, (ctx, { index, text }) => interact.typeText(ctx, index, text));

  api.tool("ira_hover", "Hover over an element", {
    index: z.number().describe("Element index"),
  }, (ctx, { index }) => interact.hover(ctx, index));

  api.tool("ira_drag", "Drag from one element to another", {
    from: z.number().describe("Start element index"),
    to: z.number().describe("End element index"),
  }, (ctx, { from, to }) => interact.drag(ctx, from, to));

  api.tool("ira_upload", "Upload a file", {
    index: z.number().describe("File input element index"),
    filePath: z.string().describe("Path to the file to upload"),
  }, (ctx, { index, filePath }) => interact.upload(ctx, index, filePath));

  api.tool("ira_select", "Select a dropdown option", {
    index: z.number().describe("Select element index"),
    value: z.string().describe("Option value to select"),
  }, (ctx, { index, value }) => interact.selectOption(ctx, index, value));

  api.tool("ira_keyboard", "Press keyboard shortcuts (Escape, Enter, Tab, arrows, Ctrl+C, etc.)", {
    key: z.string().describe("Key to press (e.g. 'Escape', 'Enter', 'Tab', 'ArrowDown', 'a', 'c')"),
    modifiers: z.array(z.string()).optional().default([]).describe("Modifier keys (e.g. ['Control'], ['Shift', 'Control'])"),
  }, (ctx, { key, modifiers }) => interact.keyboard(ctx, key, modifiers));

  // ─── Vision & Reading (9) ───────────────────────────────────────────────
  api.tool("ira_screenshot", "Take a screenshot (returns image)", {
    fullPage: z.boolean().optional().default(false).describe("Full page or viewport only"),
    format: z.enum(["png", "jpeg"]).optional().describe("Image format (default: jpeg for viewport, png for full page)"),
    quality: z.number().optional().default(85).describe("JPEG quality 1-100 (only used for jpeg format)"),
  }, (ctx, { fullPage, format, quality }) => vision.screenshot(ctx, fullPage, format, quality));

  api.tool("ira_element_screenshot", "Screenshot a specific element", {
    index: z.number().describe("Element index"),
  }, (ctx, { index }) => vision.elementScreenshot(ctx, index));

  api.tool("ira_extract_images", "Get all images with src, alt, dimensions", {}, (ctx) => vision.extractImages(ctx));
  api.tool("ira_get_state", "Get page state with interactive elements", {}, (ctx) => reading.getState(ctx));
  api.tool("ira_read_page", "Get accessibility tree", {}, (ctx) => reading.readPage(ctx));

  api.tool("ira_find", "Find elements by text description", {
    query: z.string().describe("Text to search for"),
  }, (ctx, { query }) => reading.find(ctx, query));

  api.tool("ira_extract_text", "Extract article/main text", {}, (ctx) => reading.extractText(ctx));

  api.tool("ira_extract_table", "Extract HTML table as structured JSON", {
    index: z.number().optional().default(0).describe("Table index on page"),
  }, (ctx, { index }) => reading.extractTable(ctx, index));

  api.tool("ira_get_html", "Get raw HTML", {
    selector: z.string().optional().describe("CSS selector (optional, defaults to full page)"),
  }, (ctx, { selector }) => reading.getHtml(ctx, selector));

  // ─── Tab Management (4) ─────────────────────────────────────────────────
  api.tool("ira_tabs", "List all open tabs", {}, (ctx) => tabs.tabs(ctx));
  api.tool("ira_switch_tab", "Switch to a different tab", {
    tabIndex: z.number().describe("Tab index to switch to"),
  }, (ctx, { tabIndex }) => tabs.switchTab(ctx, tabIndex));

  api.tool("ira_close_tab", "Close a tab", {
    tabIndex: z.number().describe("Tab index to close"),
  }, (ctx, { tabIndex }) => tabs.closeTab(ctx, tabIndex));

  api.tool("ira_new_tab", "Open a new tab (optionally navigate to a URL)", {
    url: z.string().optional().describe("URL to navigate to in the new tab"),
  }, (ctx, { url }) => tabs.newTab(ctx, url));

  // ─── Debug & DevTools (9) ───────────────────────────────────────────────
  api.tool("ira_console", "Read browser console logs", {
    pattern: z.string().optional().describe("Filter by regex pattern"),
    onlyErrors: z.boolean().optional().default(false).describe("Only return errors"),
    limit: z.number().optional().default(100).describe("Max messages to return"),
  }, (ctx, args) => debug.consoleLogs(ctx, args));

  api.tool("ira_network", "Read network requests", {
    urlPattern: z.string().optional().describe("Filter by URL pattern"),
    limit: z.number().optional().default(100).describe("Max requests to return"),
  }, (ctx, args) => debug.networkRequests(ctx, args));

  api.tool("ira_javascript", "Execute JavaScript in page", {
    code: z.string().describe("JavaScript code to execute"),
  }, (ctx, { code }) => debug.javascript(ctx, code));

  api.tool("ira_inspect_element", "Get DOM tree with computed styles", {
    index: z.number().describe("Element index"),
  }, (ctx, { index }) => devtools.inspectElement(ctx, index));

  api.tool("ira_get_styles", "Get computed CSS styles", {
    index: z.number().describe("Element index"),
  }, (ctx, { index }) => devtools.getStyles(ctx, index));

  api.tool("ira_performance", "Get page performance metrics", {}, (ctx) => devtools.getPagePerformance(ctx));

  api.tool("ira_storage", "View cookies, localStorage, sessionStorage", {
    type: z.string().optional().default("all").describe("cookies, localStorage, sessionStorage, or all"),
  }, (ctx, { type }) => devtools.storage(ctx, type));

  api.tool("ira_network_timing", "Get request timing waterfall", {
    urlPattern: z.string().optional().describe("Filter by URL pattern"),
  }, (ctx, { urlPattern }) => devtools.networkTiming(ctx, urlPattern));

  api.tool("ira_audit_accessibility", "Run accessibility audit", {}, (ctx) => devtools.auditAccessibility(ctx));

  // ─── Utility (7) ────────────────────────────────────────────────────────
  api.tool("ira_wait", "Wait for seconds or element", {
    seconds: z.number().optional().default(3).describe("Seconds to wait"),
    selector: z.string().optional().describe("CSS selector to wait for"),
  }, (ctx, { seconds, selector }) => utility.wait(ctx, seconds, selector));

  api.tool("ira_scroll", "Scroll the page", {
    direction: z.enum(["up", "down", "left", "right"]).optional().default("down").describe("Scroll direction"),
    amount: z.number().optional().default(500).describe("Scroll amount in pixels"),
  }, (ctx, { direction, amount }) => utility.scroll(ctx, direction, amount));

  api.tool("ira_cookies", "Get, set, or clear cookies", {
    action: z.string().describe("get, set, or clear"),
    name: z.string().optional().describe("Cookie name (for set)"),
    value: z.string().optional().describe("Cookie value (for set)"),
  }, (ctx, args) => utility.cookies(ctx, args));

  api.tool("ira_set_viewport", "Set browser viewport size (mobile, tablet, desktop)", {
    width: z.number().describe("Viewport width in pixels"),
    height: z.number().describe("Viewport height in pixels"),
  }, (ctx, { width, height }) => utility.setViewport(ctx, width, height));

  api.tool("ira_pdf", "Export current page as PDF", {
    path: z.string().optional().describe("File path to save PDF (optional, returns PDF data otherwise)"),
  }, (ctx, { path }) => utility.pdf(ctx, path));

  api.tool("ira_intercept", "Block or passthrough network requests matching a URL pattern", {
    urlPattern: z.string().describe("URL pattern to match (e.g. 'google-analytics.com')"),
    action: z.enum(["block", "passthrough"]).describe("block to abort matching requests, passthrough to disable interception"),
  }, (ctx, { urlPattern, action }) => utility.intercept(ctx, urlPattern, action));

  // ─── Instance Management (4) ────────────────────────────────────────────
  api.tool("ira_shutdown", "Close browser and shutdown server", {}, async (ctx) => {
    await shutdownBrowser(ctx.browser);
    process.exit(0);
  });

  api.tool("ira_instances", "List all IRA Chrome instances", {}, async () => {
    const instances = listInstances();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(instances, null, 2)
      }]
    };
  });

  api.tool("ira_kill_instance", "Kill a specific IRA Chrome instance by PID", {
    pid: z.number().describe("PID of the Chrome instance to kill"),
  }, async ({ pid }) => {
    const killed = await killInstance(pid);
    return {
      content: [{
        type: "text",
        text: killed ? `Instance PID ${pid} killed` : `Failed to kill PID ${pid}`
      }]
    };
  });

  api.tool("ira_kill_all", "Kill all IRA Chrome instances", {}, async () => {
    const instances = listInstances();
    let killed = 0;
    for (const inst of instances) {
      if (inst.alive) {
        await killInstance(inst.pid);
        killed++;
      }
    }
    return {
      content: [{
        type: "text",
        text: `Killed ${killed} IRA Chrome instance(s)`
      }]
    };
  });

  // ─── Health & Status (1) ────────────────────────────────────────────────
  api.tool("ira_health", "Check browser connection, page state, and server status", {}, (ctx) => status.health(ctx));

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[IRA] IRA-RESEARCHER ready with 43 tools");
}

async function cleanup() {
  if (browserInstance) {
    console.error("[IRA] Closing browser...");
    try {
      await browserInstance.close();
      console.error("[IRA] Browser closed");
    } catch (e) {
      console.error("[IRA] Browser close error:", e.message);
    }
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGHUP", cleanup);
process.on("SIGTERM", cleanup);

main().catch((err) => {
  console.error("[IRA] Fatal:", err.message);
  cleanup();
});
