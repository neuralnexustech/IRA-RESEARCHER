import { textResult, ghostFlash } from "../utils.js";
import { getInteractiveSelector } from "./selectors.js";

export async function screenshot(ctx, fullPage, format, quality) {
  try {
    await ghostFlash(ctx);
    const finalFormat = format || (fullPage ? "png" : "jpeg");
    const opts = { fullPage: !!fullPage };
    if (finalFormat === "jpeg") {
      opts.type = "jpeg";
      opts.quality = typeof quality === "number" ? quality : 85;
    } else {
      opts.type = "png";
    }
    const buf = await ctx.page.screenshot(opts);
    const base64 = Buffer.from(buf).toString("base64");
    const sizeKB = Math.round(buf.length / 1024);
    const mimeType = opts.type === "jpeg" ? "image/jpeg" : "image/png";
    return {
      content: [
        { type: "text", text: `Screenshot (${fullPage ? "full page" : "viewport"}, ${mimeType.split("/")[1]}, ${sizeKB}KB)` },
        { type: "image", data: base64, mimeType },
      ],
    };
  } catch (e) {
    return textResult(`Screenshot failed: ${e.message}`);
  }
}

export async function elementScreenshot(ctx, index) {
  try {
    const el = await ctx.page.evaluate((idx) => {
      const els = document.querySelectorAll(getInteractiveSelector());
      let count = 0;
      for (const e of els) {
        const rect = e.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (count === idx) {
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }
          count++;
        }
      }
      return null;
    }, index);
    if (!el) return textResult(`Element ${index} not found`);
    const buf = await ctx.page.screenshot({ clip: { x: el.x, y: el.y, width: el.width, height: el.height } });
    const base64 = Buffer.from(buf).toString("base64");
    return {
      content: [
        { type: "text", text: `Element ${index} screenshot (${Math.round(el.width)}x${Math.round(el.height)})` },
        { type: "image", data: base64, mimeType: "image/png" },
      ],
    };
  } catch (e) {
    return textResult(`Element screenshot failed: ${e.message}`);
  }
}

export async function extractImages(ctx) {
  try {
    const images = await ctx.page.evaluate(() => {
      const results = [];
      const seen = new Set();
      // <img> tags
      document.querySelectorAll("img").forEach((img) => {
        if (img.src && !seen.has(img.src)) {
          seen.add(img.src);
          results.push({
            src: img.src,
            alt: img.alt || "",
            type: "img",
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            displayed: img.getBoundingClientRect().width > 0,
          });
        }
      });
      // background-image
      document.querySelectorAll("[style]").forEach((el) => {
        const match = el.style.backgroundImage?.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          results.push({
            src: match[1],
            alt: "",
            type: "background-image",
            width: Math.round(el.getBoundingClientRect().width),
            height: Math.round(el.getBoundingClientRect().height),
            displayed: el.getBoundingClientRect().width > 0,
          });
        }
      });
      // canvas
      document.querySelectorAll("canvas").forEach((c) => {
        if (c.width > 0 && c.height > 0) {
          try {
            const dataUrl = c.toDataURL();
            if (dataUrl && dataUrl.length > 100 && !seen.has(dataUrl.substring(0, 50))) {
              seen.add(dataUrl.substring(0, 50));
              results.push({
                src: dataUrl.substring(0, 80) + "...",
                alt: c.getAttribute("aria-label") || "",
                type: "canvas",
                width: c.width,
                height: c.height,
                displayed: c.getBoundingClientRect().width > 0,
              });
            }
          } catch (e) {
            // Cross-origin canvas, skip
          }
        }
      });
      // video poster
      document.querySelectorAll("video[poster]").forEach((v) => {
        if (v.poster && !seen.has(v.poster)) {
          seen.add(v.poster);
          results.push({
            src: v.poster,
            alt: v.getAttribute("aria-label") || v.title || "",
            type: "video-poster",
            width: v.getBoundingClientRect().width,
            height: v.getBoundingClientRect().height,
            displayed: v.getBoundingClientRect().width > 0,
          });
        }
      });
      return results;
    });
    if (images.length === 0) return textResult("No images found on page");
    let text = `Found ${images.length} images:\n\n`;
    images.forEach((img, i) => {
      text += `[${i}] [${img.type}] src="${img.src.substring(0, 100)}" alt="${img.alt}" ${img.width}x${img.height}${img.displayed ? " (visible)" : " (hidden)"}\n`;
    });
    return textResult(text);
  } catch (e) {
    return textResult(`Extract images failed: ${e.message}`);
  }
}
