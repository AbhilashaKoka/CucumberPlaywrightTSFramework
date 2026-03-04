// utils/actions.ts
import { Page, Locator, FrameLocator } from "@playwright/test";

type Target = string | Locator;

export class Actions {
  private constructor() {} // static-only

  // -------------------------
  // Helpers
  // -------------------------
  private static asLocator(page: Page, target: Target): Locator {
    return typeof target === "string" ? page.locator(target) : target;
  }

  static async waitReady(page: Page, target: Target, timeout = 10_000) {
    const loc = Actions.asLocator(page, target);
    await loc.waitFor({ state: "visible", timeout });
    await loc.scrollIntoViewIfNeeded();
    return loc;
  }

  // -------------------------
  // Mouse actions
  // -------------------------
  static async click(page: Page, target: Target, options?: {
    timeout?: number;
    force?: boolean;
    trial?: boolean;
  }) {
    const loc = await Actions.waitReady(page, target, options?.timeout);
    await loc.click({ force: options?.force, trial: options?.trial });
  }

  static async doubleClick(page: Page, target: Target, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.dblclick();
  }

  static async rightClick(page: Page, target: Target, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.click({ button: "right" });
  }

  static async hover(page: Page, target: Target, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.hover();
  }

  static async clickAt(page: Page, target: Target, x: number, y: number, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.click({ position: { x, y } });
  }

  // Useful when a normal click is intercepted (overlays, sticky headers)
  static async safeClick(page: Page, target: Target, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);

    // Attempt normal click first
    try {
      await loc.click({ timeout: 3_000 });
      return;
    } catch {}

    // Try clicking after hover (some menus require it)
    try {
      await loc.hover({ timeout: 2_000 });
      await loc.click({ timeout: 3_000 });
      return;
    } catch {}

    // Fallback: force click
    await loc.click({ force: true });
  }

  // -------------------------
  // Keyboard actions
  // -------------------------
  static async type(page: Page, target: Target, text: string, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.fill("");           // clear reliably
    await loc.type(text);         // more human-like than fill
  }

  static async fill(page: Page, target: Target, text: string, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.fill(text);
  }

  static async press(page: Page, target: Target, key: string, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.press(key);         // e.g., "Enter", "Tab"
  }

  static async shortcut(page: Page, combo: string) {
    // e.g. "Control+A", "Control+Shift+P", "Meta+A"
    await page.keyboard.press(combo);
  }

  static async ctrlADelete(page: Page, target: Target, timeout = 10_000) {
    const loc = await Actions.waitReady(page, target, timeout);
    await loc.click();
    // Control on Win/Linux, Meta on Mac
    const isMac = process.platform === "darwin";
    await page.keyboard.press(`${isMac ? "Meta" : "Control"}+A`);
    await page.keyboard.press("Backspace");
  }

  // -------------------------
  // Drag & Drop
  // -------------------------
  static async dragAndDrop(page: Page, source: Target, target: Target, timeout = 10_000) {
    const src = await Actions.waitReady(page, source, timeout);
    const dst = await Actions.waitReady(page, target, timeout);
    await src.dragTo(dst);
  }

  // For “grab-and-move” / canvas style drags
  static async dragByOffset(page: Page, source: Target, x: number, y: number, timeout = 10_000) {
    const src = await Actions.waitReady(page, source, timeout);
    const box = await src.boundingBox();
    if (!box) throw new Error("Unable to get bounding box for drag source.");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + x, box.y + box.height / 2 + y);
    await page.mouse.up();
  }

  /**
   * HTML5 Drag & Drop fallback (rarely needed in Playwright, but helpful)
   * Works when an app requires DataTransfer events.
   */
  static async html5DragAndDrop(page: Page, source: Target, target: Target, timeout = 10_000) {
    const src = await Actions.waitReady(page, source, timeout);
    const dst = await Actions.waitReady(page, target, timeout);

    await page.evaluate(async ([sourceSelector, targetSelector]) => {
      const source = document.querySelector(sourceSelector);
      const target = document.querySelector(targetSelector);
      if (!source || !target) throw new Error("Source/Target not found");

      const dataTransfer = new DataTransfer();

      const fire = (el: Element, type: string) => {
        const evt = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
        el.dispatchEvent(evt);
      };

      fire(source, "dragstart");
      fire(target, "dragenter");
      fire(target, "dragover");
      fire(target, "drop");
      fire(source, "dragend");
    }, [src.toString(), dst.toString()]);
  }
}