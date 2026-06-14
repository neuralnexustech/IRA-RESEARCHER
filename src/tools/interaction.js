import { textResult, ghostLog, ghostRipple, ghostTypingGlow, ghostDrag } from "../utils.js";
import { getInteractiveSelector, getInputSelector } from "./selectors.js";

function getElementCoords(page, index, selector) {
  return page.evaluate((idx, sel) => {
    const elements = document.querySelectorAll(sel);
    let count = 0;
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (count === idx) {
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
        count++;
      }
    }
    return null;
  }, index, selector);
}

export async function click(ctx, args) {
  try {
    const { index, x, y } = args;
    let cx, cy;

    if (x !== undefined && y !== undefined) {
      cx = x;
      cy = y;
    } else if (index !== undefined) {
      const coords = await getElementCoords(ctx.page, index, getInteractiveSelector());
      if (!coords) return textResult(`Element ${index} not found`);
      cx = coords.x + (Math.random() * 4 - 2);
      cy = coords.y + (Math.random() * 4 - 2);
    } else {
      return textResult("Provide index or x,y coordinates");
    }

    await ghostRipple(ctx, cx, cy);
    await ctx.page.mouse.click(cx, cy);
    await new Promise((r) => setTimeout(r, 300));
    return textResult(`Clicked at (${Math.round(cx)}, ${Math.round(cy)})`);
  } catch (e) {
    return textResult(`Click failed: ${e.message}`);
  }
}

export async function typeText(ctx, index, text) {
  try {
    const selector = getInteractiveSelector();
    const coords = await ctx.page.evaluate(({ idx, sel }) => {
      const elements = document.querySelectorAll(sel);
      let count = 0;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (count === idx) {
            const isInput = ['INPUT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable || el.getAttribute('role') === 'textbox';
            if (!isInput) return { error: `Element ${idx} is not an input field` };
            el.focus();
            el.click();
            el.scrollIntoView({ block: "center" });
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
          count++;
        }
      }
      return null;
    }, { idx: index, sel: selector });

    if (!coords) return textResult(`Element ${index} not found`);
    if (coords.error) return textResult(coords.error);

    await ghostTypingGlow(ctx);
    await ctx.page.mouse.click(coords.x, coords.y);
    await new Promise((r) => setTimeout(r, 100));
    await ctx.page.keyboard.down("Control");
    await ctx.page.keyboard.press("a");
    await ctx.page.keyboard.up("Control");
    await ctx.page.keyboard.press("Backspace");

    // Human-like typing with variable delays
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prev = i > 0 ? text[i - 1] : '';
      // Base delay 30-80ms
      let delay = 30 + Math.random() * 50;
      // Pause longer at word boundaries (space or punctuation)
      if (char === ' ' || '.!?,;:'.includes(char)) {
        delay += 60 + Math.random() * 80;
      }
      // Occasional longer pause (like thinking) — 5% chance
      if (Math.random() < 0.05) {
        delay += 150 + Math.random() * 200;
      }
      // Slightly faster for repeated characters
      if (char === prev) {
        delay *= 0.6;
      }
      await ctx.page.keyboard.type(char, { delay });
    }
    await ghostLog(ctx, "success", `Typed "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`);
    return textResult(`Typed "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`);
  } catch (e) {
    return textResult(`Type failed: ${e.message}`);
  }
}

export async function hover(ctx, index) {
  try {
    const coords = await getElementCoords(ctx.page, index, getInteractiveSelector());
    if (!coords) return textResult(`Element ${index} not found`);
    await ctx.page.mouse.move(coords.x, coords.y);
    await ghostLog(ctx, "action", `Hovered over element ${index}`);
    return textResult(`Hovered over element ${index}`);
  } catch (e) {
    return textResult(`Hover failed: ${e.message}`);
  }
}

export async function drag(ctx, fromIndex, toIndex) {
  try {
    const from = await getElementCoords(ctx.page, fromIndex, getInteractiveSelector());
    const to = await getElementCoords(ctx.page, toIndex, getInteractiveSelector());
    if (!from || !to) return textResult("Element not found for drag");
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    await ghostDrag(ctx, from.x, from.y, to.x, to.y);
    await ctx.page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (el) el.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: new DataTransfer() }));
    }, { x: from.x, y: from.y });
    await ctx.page.mouse.move(from.x, from.y);
    await ctx.page.mouse.down();
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const cx = from.x + ((to.x - from.x) * i) / steps;
      const cy = from.y + ((to.y - from.y) * i) / steps;
      await ctx.page.mouse.move(cx, cy);
      if (i === Math.floor(steps / 2)) {
        await ctx.page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          if (el) el.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: new DataTransfer() }));
        }, { x: cx, y: cy });
      }
      await new Promise((r) => setTimeout(r, 20));
    }
    await ctx.page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (el) {
        el.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: new DataTransfer() }));
        el.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: new DataTransfer() }));
      }
    }, { x: to.x, y: to.y });
    await ctx.page.mouse.up();
    await ghostLog(ctx, "success", `Dragged from ${fromIndex} to ${toIndex}`);
    return textResult(`Dragged from element ${fromIndex} to ${toIndex}`);
  } catch (e) {
    return textResult(`Drag failed: ${e.message}`);
  }
}

export async function upload(ctx, index, filePath) {
  try {
    const found = await ctx.page.evaluate((idx) => {
      const inputs = document.querySelectorAll('input[type="file"]');
      if (!inputs[idx]) return false;
      inputs[idx].click();
      return true;
    }, index);
    if (!found) return textResult(`File input ${index} not found`);
    const fileChooser = await ctx.page.waitForFileChooser({ timeout: 5000 });
    await fileChooser.accept([filePath]);
    await ghostLog(ctx, "success", `Uploaded file to element ${index}`);
    return textResult(`Uploaded ${filePath}`);
  } catch (e) {
    return textResult(`Upload failed: ${e.message}`);
  }
}

export async function keyboard(ctx, key, modifiers = []) {
  try {
    for (const mod of modifiers) {
      await ctx.page.keyboard.down(mod);
    }
    await ctx.page.keyboard.press(key);
    const label = modifiers.length ? modifiers.join("+") + "+" + key : key;
    await ghostLog(ctx, "action", `Pressed ${label}`);
    return textResult(`Pressed ${label}`);
  } catch (e) {
    return textResult(`Keyboard failed: ${e.message}`);
  } finally {
    for (const mod of modifiers) {
      await ctx.page.keyboard.up(mod).catch(() => {});
    }
  }
}

export async function selectOption(ctx, index, value) {
  try {
    const result = await ctx.page.evaluate(({ idx, val }) => {
      const selects = document.querySelectorAll("select");
      let count = 0;
      for (const sel of selects) {
        const rect = sel.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (count === idx) {
            for (const opt of sel.options) {
              if (opt.value === val || opt.textContent.trim() === val) {
                sel.value = opt.value;
                sel.dispatchEvent(new Event("change", { bubbles: true }));
                return { success: true, selected: opt.textContent.trim() };
              }
            }
            return { success: false, error: "Option not found" };
          }
          count++;
        }
      }
      return { success: false, error: "Select not found" };
    }, { idx: index, val: value });
    if (result.success) {
      await ghostLog(ctx, "success", `Selected "${result.selected}" in element ${index}`);
      return textResult(`Selected "${result.selected}"`);
    }
    return textResult(`Select failed: ${result.error}`);
  } catch (e) {
    return textResult(`Select failed: ${e.message}`);
  }
}
