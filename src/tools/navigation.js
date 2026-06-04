import { textResult, ghostLog } from "../utils.js";

export async function navigate(ctx, url) {
  try {
    await ghostLog(ctx, "action", `Navigating to ${url}`);
    await ctx.page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const content = await ctx.page.content();
    if (content.length < 500) {
      await new Promise((r) => setTimeout(r, 3000));
      await ctx.page.reload({ waitUntil: "domcontentloaded" });
    }
    await ghostLog(ctx, "success", `Navigated to ${url}`);
    return textResult(`Navigated to ${url}`);
  } catch (e) {
    return textResult(`Navigation failed: ${e.message}`);
  }
}

export async function goBack(ctx) {
  try {
    await ctx.page.goBack({ waitUntil: "domcontentloaded" });
    await ghostLog(ctx, "action", "Went back");
    return textResult("Navigated back");
  } catch (e) {
    return textResult(`Go back failed: ${e.message}`);
  }
}

export async function goForward(ctx) {
  try {
    await ctx.page.goForward({ waitUntil: "domcontentloaded" });
    await ghostLog(ctx, "action", "Went forward");
    return textResult("Navigated forward");
  } catch (e) {
    return textResult(`Go forward failed: ${e.message}`);
  }
}

export async function reload(ctx) {
  try {
    await ctx.page.reload({ waitUntil: "domcontentloaded" });
    await ghostLog(ctx, "action", "Page reloaded");
    return textResult("Page reloaded");
  } catch (e) {
    return textResult(`Reload failed: ${e.message}`);
  }
}
