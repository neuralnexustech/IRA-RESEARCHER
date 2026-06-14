import { textResult } from "../utils.js";
import { getInteractiveSelector } from "./selectors.js";

export async function getState(ctx) {
  try {
    const state = await ctx.page.evaluate((selector) => {
      const interactive = document.querySelectorAll(selector);
      const elements = [];
      let visibleIdx = 0;
      interactive.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          elements.push({
            index: visibleIdx++,
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || "").trim().substring(0, 80),
            type: el.type || "",
            href: el.href || "",
            placeholder: el.placeholder || "",
            value: el.value?.substring(0, 30) || "",
            disabled: !!el.disabled,
            bounds: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          });
        }
      });
      return {
        url: location.href,
        title: document.title,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        scroll: { x: window.scrollX, y: window.scrollY },
        elementCount: elements.length,
        elements,
      };
    }, getInteractiveSelector());
    return textResult(JSON.stringify(state, null, 2));
  } catch (e) {
    return textResult(`Get state failed: ${e.message}`);
  }
}

export async function readPage(ctx) {
  try {
    const tree = await ctx.page.evaluate(() => {
      function buildTree(el, depth) {
        if (depth > 30 || !el || el.nodeType !== 1) return null;
        const tag = el.tagName.toLowerCase();
        if (["script", "style", "noscript", "template"].includes(tag)) return null;
        const rect = el.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0;
        const role = el.getAttribute("role") || "";
        const text = (el.textContent || "").trim().substring(0, 100);
        const node = {
          tag,
          id: el.id || "",
          class: (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '').substring(0, 50),
          role,
          text: text.substring(0, 60),
          visible,
          children: [],
        };
        for (const child of el.children) {
          const childNode = buildTree(child, depth + 1);
          if (childNode) node.children.push(childNode);
        }
        if (node.children.length === 0 && !node.text && !node.role && !node.id) return null;
        return node;
      }
      return buildTree(document.body, 0);
    });
    return textResult(tree ? JSON.stringify(tree, null, 2).substring(0, 50000) : "Empty page");
  } catch (e) {
    return textResult(`Read page failed: ${e.message}`);
  }
}

export async function find(ctx, query) {
  try {
    const results = await ctx.page.evaluate((q) => {
      const ql = q.toLowerCase();
      const all = document.querySelectorAll("a, button, input, textarea, select, h1, h2, h3, h4, h5, h6, p, li, span, img, label");
      const found = [];
      all.forEach((el) => {
        if (found.length >= 20) return;
        const text = (el.textContent || "").trim();
        const alt = el.getAttribute("alt") || "";
        const placeholder = el.getAttribute("placeholder") || "";
        const ariaLabel = el.getAttribute("aria-label") || "";
        const searchText = (text + " " + alt + " " + placeholder + " " + ariaLabel).toLowerCase();
        if (searchText.includes(ql)) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            found.push({
              tag: el.tagName.toLowerCase(),
              text: text.substring(0, 120),
              type: el.type || "",
              href: el.href || "",
              src: el.src || "",
              coords: { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) },
            });
          }
        }
      });
      return { count: found.length, results: found };
    }, query);
    if (results.count === 0) return textResult(`No elements found matching "${query}"`);
    let out = `Found ${results.count} elements matching "${query}":\n\n`;
    results.results.forEach((r, i) => {
      out += `[${i}] <${r.tag}> ${r.text.substring(0, 80)}`;
      if (r.href) out += ` (${r.href.substring(0, 60)})`;
      out += ` at (${r.coords.x}, ${r.coords.y})\n`;
    });
    return textResult(out);
  } catch (e) {
    return textResult(`Find failed: ${e.message}`);
  }
}

export async function extractText(ctx) {
  try {
    const text = await ctx.page.evaluate(() => {
      const article = document.querySelector("article, main, [role=main], .content, #content, .post-content, .entry-content");
      const el = article || document.body;
      const clone = el.cloneNode(true);
      clone.querySelectorAll("script, style, noscript, svg, iframe").forEach((n) => n.remove());
      return clone.textContent.replace(/\s+/g, " ").trim().substring(0, 50000);
    });
    return textResult(text || "No text content found");
  } catch (e) {
    return textResult(`Extract text failed: ${e.message}`);
  }
}

export async function extractTable(ctx, index = 0) {
  try {
    const data = await ctx.page.evaluate((idx) => {
      const tables = document.querySelectorAll('table');
      if (!tables[idx]) return null;
      const table = tables[idx];
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return { headers: [], rows: [] };
      const headers = Array.from(rows[0].querySelectorAll('th, td')).map(cell => cell.textContent.trim());
      const bodyRows = rows.slice(1).map(row => {
        const cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h || `col${i}`] = cells[i] ?? ''; });
        return obj;
      });
      return { tableCount: tables.length, headers, rows: bodyRows };
    }, index);
    if (!data) return textResult(`Table ${index} not found`);
    return textResult(JSON.stringify(data, null, 2));
  } catch (e) {
    return textResult(`Extract table failed: ${e.message}`);
  }
}

export async function getHtml(ctx, selector) {
  try {
    let html;
    if (selector) {
      html = await ctx.page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.outerHTML : null;
      }, selector);
    } else {
      html = await ctx.page.evaluate(() => document.documentElement.outerHTML);
    }
    if (!html) return textResult(`No element found for selector: ${selector}`);
    return textResult(html.substring(0, 50000));
  } catch (e) {
    return textResult(`Get HTML failed: ${e.message}`);
  }
}
