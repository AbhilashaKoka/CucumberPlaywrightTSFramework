// utils/assert.util.ts
import { expect, Locator } from '@playwright/test';

type TextLike = string | RegExp | Array<string | RegExp>;

export class AssertUtil {
  private constructor() {}

  /** Ensures locator resolves to exactly one element (unless allowMany=true). */
  static async ensureCount(locator: Locator, allowMany = false) {
    const count = await locator.count();
    if (!allowMany && count !== 1) {
      const sample = await locator.allInnerTexts().catch(() => []);
      throw new Error(
        `Expected exactly 1 element, but found ${count}.\n` +
        `Locator: ${locator}\n` +
        `Sample innerTexts: ${JSON.stringify(sample.slice(0, 5), null, 2)}`
      );
    }
    return count;
  }

  /** Visible check with better error context */
  static async toBeVisible(locator: Locator, timeout = 10_000) {
    await expect(locator).toBeVisible({ timeout });
  }

  /** Text check that works for both single and multiple elements */
  static async toHaveText(locator: Locator, expected: TextLike, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 10_000;
    const count = await locator.count();

    if (Array.isArray(expected)) {
      // Expecting multiple elements
      if (count !== expected.length) {
        const texts = await locator.allInnerTexts();
        throw new Error(
          `toHaveText array length mismatch. Expected ${expected.length}, got ${count}.\n` +
          `Actual texts: ${JSON.stringify(texts, null, 2)}`
        );
      }
      await expect(locator).toHaveText(expected as any, { timeout });
      return;
    }

    // Single expected value
    await this.ensureCount(locator);
    await expect(locator).toHaveText(expected as any, { timeout });
  }

  /** Use contains when extra text exists around your expected part */
  static async toContainText(locator: Locator, expected: string | RegExp, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 10_000;
    await expect(locator).toContainText(expected as any, { timeout });
  }

  /** Debug helper to quickly dump what Playwright sees */
  static async debugText(locator: Locator) {
    const count = await locator.count();
    const texts = await locator.allInnerTexts();
    console.log({ count, texts });
  }
}