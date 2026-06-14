import { textResult } from "../utils.js";
import { getInteractiveSelector } from "./selectors.js";

export async function inspectElement(ctx, index) {
  try {
    const info = await ctx.page.evaluate((idx) => {
      const els = document.querySelectorAll(getInteractiveSelector());
      let count = 0;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (count === idx) {
            const styles = window.getComputedStyle(el);
            return {
              tag: el.tagName.toLowerCase(),
              id: el.id,
              className: el.className,
              attributes: Array.from(el.attributes).map((a) => ({ name: a.name, value: a.value })),
              text: (el.textContent || "").trim().substring(0, 200),
              rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
              computed: {
                display: styles.display,
                visibility: styles.visibility,
                position: styles.position,
                zIndex: styles.zIndex,
                opacity: styles.opacity,
                overflow: styles.overflow,
              },
              html: el.outerHTML.substring(0, 1000),
            };
          }
          count++;
        }
      }
      return null;
    }, index);
    if (!info) return textResult(`Element ${index} not found`);
    return textResult(JSON.stringify(info, null, 2));
  } catch (e) {
    return textResult(`Inspect element failed: ${e.message}`);
  }
}

export async function getStyles(ctx, index) {
  try {
    const styles = await ctx.page.evaluate((idx) => {
      const els = document.querySelectorAll(getInteractiveSelector());
      let count = 0;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (count === idx) {
            const cs = window.getComputedStyle(el);
            const props = [
              "display","position","width","height","margin","padding","color","backgroundColor","fontSize",
              "fontFamily","fontWeight","textAlign","border","borderRadius","boxShadow","opacity","visibility",
              "zIndex","overflow","cursor","transform","transition","animation","flex","grid","gap",
            ];
            const result = {};
            props.forEach((p) => { result[p] = cs[p]; });
            return result;
          }
          count++;
        }
      }
      return null;
    }, index);
    if (!styles) return textResult(`Element ${index} not found`);
    return textResult(JSON.stringify(styles, null, 2));
  } catch (e) {
    return textResult(`Get styles failed: ${e.message}`);
  }
}

export async function getPagePerformance(ctx) {
  try {
    const metrics = await ctx.page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) return { error: "No navigation timing available" };
      return {
        loadTime: nav.loadEventEnd - nav.startTime,
        domReady: nav.domContentLoadedEventEnd - nav.startTime,
        ttfb: nav.responseStart - nav.requestStart,
        domInteractive: nav.domInteractive - nav.startTime,
        resources: performance.getEntriesByType("resource").length,
        totalSize: performance.getEntriesByType("resource")
          .reduce((sum, r) => sum + (r.transferSize || 0), 0),
        url: location.href,
        userAgent: navigator.userAgent.substring(0, 100),
      };
    });
    return textResult(JSON.stringify(metrics, null, 2));
  } catch (e) {
    return textResult(`Performance failed: ${e.message}`);
  }
}

export async function storage(ctx, type) {
  try {
    const data = await ctx.page.evaluate((t) => {
      const result = {};
      if (t === "all" || t === "localStorage") {
        result.localStorage = { ...localStorage };
      }
      if (t === "all" || t === "sessionStorage") {
        result.sessionStorage = { ...sessionStorage };
      }
      return result;
    }, type || "all");
    const cookies = await ctx.page.cookies();
    const result = { cookies };
    if (data.localStorage) result.localStorage = data.localStorage;
    if (data.sessionStorage) result.sessionStorage = data.sessionStorage;
    return textResult(JSON.stringify(result, null, 2));
  } catch (e) {
    return textResult(`Storage failed: ${e.message}`);
  }
}

export async function networkTiming(ctx, urlPattern) {
  try {
    const timings = await ctx.page.evaluate((pattern) => {
      const resources = performance.getEntriesByType("resource");
      let filtered = resources;
      if (pattern) {
        filtered = resources.filter((r) => r.name.includes(pattern));
      }
      return filtered.slice(0, 50).map((r) => ({
        url: r.name.substring(0, 120),
        type: r.initiatorType,
        duration: Math.round(r.duration),
        ttfb: Math.round(r.responseStart - r.requestStart),
        download: Math.round(r.responseEnd - r.responseStart),
        size: r.transferSize || r.encodedBodySize || 0,
      }));
    }, urlPattern || "");
    if (timings.length === 0) return textResult("No network requests found");
    let out = `Network timing (${timings.length} requests):\n\n`;
    timings.forEach((t, i) => {
      out += `[${i}] ${t.type} ${t.url.substring(0, 80)}\n`;
      out += `     TTFB: ${t.ttfb}ms | Download: ${t.download}ms | Total: ${t.duration}ms | Size: ${(t.size / 1024).toFixed(1)}KB\n\n`;
    });
    return textResult(out);
  } catch (e) {
    return textResult(`Network timing failed: ${e.message}`);
  }
}

export async function auditAccessibility(ctx) {
  try {
    const audit = await ctx.page.evaluate(() => {
      const issues = [];
      document.querySelectorAll("img:not([alt])").forEach((img) => {
        if (img.getBoundingClientRect().width > 0) {
          issues.push({ type: "error", element: "img", message: `Image missing alt text: ${img.src.substring(0, 60)}` });
        }
      });
      document.querySelectorAll("a:not([aria-label])").forEach((a) => {
        if (!a.textContent.trim() && !a.querySelector("img")) {
          issues.push({ type: "warning", element: "a", message: `Link has no text: ${a.href.substring(0, 60)}` });
        }
      });
      document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button])").forEach((input) => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        if (!label && !input.getAttribute("aria-label")) {
          issues.push({ type: "warning", element: "input", message: `Input missing label: name="${input.name}"` });
        }
      });
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      if (headings.length === 0) {
        issues.push({ type: "warning", element: "page", message: "Page has no heading elements (h1-h6)" });
      }
      if (!document.querySelector("meta[name=viewport]")) {
        issues.push({ type: "error", element: "meta", message: "Missing viewport meta tag" });
      }
      const errors = issues.filter((i) => i.type === "error").length;
      const warnings = issues.filter((i) => i.type === "warning").length;
      return {
        score: Math.max(0, Math.min(100, 100 - errors * 20 - warnings * 5)),
        summary: `${errors} errors, ${warnings} warnings`,
        issues,
        totalElements: document.querySelectorAll("*").length,
      };
    });
    return textResult(JSON.stringify(audit, null, 2));
  } catch (e) {
    return textResult(`Accessibility audit failed: ${e.message}`);
  }
}
