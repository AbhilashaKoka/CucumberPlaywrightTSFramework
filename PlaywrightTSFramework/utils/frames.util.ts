// utils/frame.util.ts
import { Page, FrameLocator, Locator } from "@playwright/test";

export class FrameUtil {
  private constructor() {}

  static frame(page: Page, frameSelector: string): FrameLocator {
    // Prefer stable iframe selector: id/data-testid/name
    return page.frameLocator(frameSelector);
  }

  static locatorInFrame(page: Page, frameSelector: string, locator: string): Locator {
    return page.frameLocator(frameSelector).locator(locator);
  }

  static async fillInFrame(page: Page, frameSelector: string, fieldSelector: string, value: string) {
    const field = page.frameLocator(frameSelector).locator(fieldSelector);
    await field.waitFor({ state: "visible" });
    await field.fill(value);
  }

  static async clickInFrame(page: Page, frameSelector: string, selector: string) {
    const el = page.frameLocator(frameSelector).locator(selector);
    await el.waitFor({ state: "visible" });
    await el.click();
  }
}
