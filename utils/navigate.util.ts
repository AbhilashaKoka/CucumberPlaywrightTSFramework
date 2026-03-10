// utils/navigate.util.ts
import { Page, BrowserContext, expect } from "@playwright/test";

export type WaitUntil = "load" | "domcontentloaded" | "networkidle" | "commit";

export interface GotoOptions {
  waitUntil?: WaitUntil;        // default: "domcontentloaded"
  timeout?: number;             // default: 30s
  retries?: number;             // default: 1
  retryDelayMs?: number;        // default: 1000ms
  referer?: string;
}

export class NavigateUtil {
  private constructor() {}

  /**
   * Robust goto with retries + common waiting behavior.
   * For SPAs, domcontentloaded is often sufficient; for heavy apps, use networkidle.
   */
  static async goto(page: Page, url: string, options: GotoOptions = {}) {
    const {
      waitUntil = "domcontentloaded",
      timeout = 30_000,
      retries = 1,
      retryDelayMs = 1000,
      referer
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await page.goto(url, { waitUntil, timeout, referer });
        return;
      } catch (err) {
        lastError = err;
        if (attempt === retries) break;
        await page.waitForTimeout(retryDelayMs);
      }
    }

    throw new Error(`Failed to navigate to "${url}" after ${retries + 1} attempt(s). Error: ${String(lastError)}`);
  }

  /** Go back and optionally wait for URL change or load state */
  static async back(page: Page, options?: { waitUntil?: WaitUntil; timeout?: number }) {
    const waitUntil = options?.waitUntil ?? "domcontentloaded";
    const timeout = options?.timeout ?? 30_000;
    await page.goBack({ waitUntil, timeout });
  }

  /** Go forward and optionally wait for URL change or load state */
  static async forward(page: Page, options?: { waitUntil?: WaitUntil; timeout?: number }) {
    const waitUntil = options?.waitUntil ?? "domcontentloaded";
    const timeout = options?.timeout ?? 30_000;
    await page.goForward({ waitUntil, timeout });
  }

  /** Reload the page */
  static async reload(page: Page, options?: { waitUntil?: WaitUntil; timeout?: number }) {
    const waitUntil = options?.waitUntil ?? "domcontentloaded";
    const timeout = options?.timeout ?? 30_000;
    await page.reload({ waitUntil, timeout });
  }

  /** Wait for a URL match (string, regex) */
  static async waitForURL(page: Page, url: string | RegExp, options?: { timeout?: number; waitUntil?: WaitUntil }) {
    const timeout = options?.timeout ?? 30_000;
    const waitUntil = options?.waitUntil ?? "domcontentloaded";
    await page.waitForURL(url, { timeout, waitUntil });
  }

  /** Assert current URL equals / matches */
  static async expectURL(page: Page, url: string | RegExp) {
    await expect(page).toHaveURL(url);
  }

  /**
   * Navigate within SPA by clicking something and waiting for URL to change/match.
   * Very useful when click triggers router navigation.
   */
  static async clickAndWaitForURL(params: {
    page: Page;
    click: () => Promise<void>;
    url: string | RegExp;
    timeout?: number;
    waitUntil?: WaitUntil;
  }) {
    const { page, click, url, timeout = 30_000, waitUntil = "domcontentloaded" } = params;
    await Promise.all([
      page.waitForURL(url, { timeout, waitUntil }),
      click()
    ]);
  }

  /**
   * Wait for navigation triggered by an action (form submit, link click etc.)
   * Use when URL may not change predictably, but a navigation happens.
   */
  static async actionAndWaitForNavigation(params: {
    page: Page;
    action: () => Promise<void>;
    timeout?: number;
    waitUntil?: WaitUntil;
  }) {
    const { page, action, timeout = 30_000, waitUntil = "domcontentloaded" } = params;

    await Promise.all([
      page.waitForNavigation({ timeout, waitUntil }),
      action()
    ]);
  }

  /** Wait for a new tab / popup opened by an action (window.open or target=_blank). */
  static async waitForPopup<T extends Page = Page>(page: Page, action: () => Promise<void>, timeout = 30_000): Promise<T> {
    const [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout }),
      action()
    ]);
    await popup.waitForLoadState("domcontentloaded");
    return popup as T;
  }

  /** Get the active pages in the context (tabs). */
  static pages(context: BrowserContext): Page[] {
    return context.pages();
  }

  /**
   * Switch to a tab by URL match.
   * Returns the matching page or throws if not found.
   */
  static async switchToPageByURL(context: BrowserContext, url: string | RegExp, timeout = 10_000): Promise<Page> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      for (const p of context.pages()) {
        const current = p.url();
        if (typeof url === "string" ? current.includes(url) : url.test(current)) {
          await p.bringToFront();
          return p;
        }
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(`No page found matching URL: ${String(url)} within ${timeout}ms`);
  }

  /**
   * Switch to a tab by title (handy for apps opening reports etc.)
   */
  static async switchToPageByTitle(context: BrowserContext, title: string | RegExp, timeout = 10_000): Promise<Page> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      for (const p of context.pages()) {
        const t = await p.title().catch(() => "");
        if (typeof title === "string" ? t.includes(title) : title.test(t)) {
          await p.bringToFront();
          return p;
        }
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(`No page found matching title: ${String(title)} within ${timeout}ms`);
  }

  /**
   * Build URL with query params safely.
   * Example: buildUrl("https://site/app", { q: "abc", page: 2 })
   */
  static buildUrl(base: string, params?: Record<string, string | number | boolean | undefined | null>) {
    if (!params) return base;
    const url = new URL(base);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
    return url.toString();
  }
}
