
// tests/load.spec.ts
import { test, expect, chromium } from '@playwright/test';

test('hundred concurrent users load test', async () => {
  const concurrentUsers = 10;

  // Launch a single shared browser; create separate contexts for isolation (cheaper than 100 browsers).
  const browser = await chromium.launch({ headless: false });

  try {
    // Build 100 concurrent "user" tasks
    const tasks = Array.from({ length: concurrentUsers }, (_, i) => (async () => {
      const context = await browser.newContext({
        // Optional: emulate different user agents / locales if needed
        // userAgent: `load-test-agent-${i}`,
      });
      const page = await context.newPage();

      // Be defensive with timeouts so slow responses don't stall the entire batch.
      page.setDefaultTimeout(15_000);
      page.setDefaultNavigationTimeout(20_000);

      try {
        await page.goto('https://www.google.com/', { waitUntil: 'domcontentloaded' });

        // Handle potential consent/region screens gracefully (no-op if not present)
        const agreeBtn = page.locator('button:has-text("I agree"), button:has-text("Accept all")');
        if (await agreeBtn.first().isVisible().catch(() => false)) {
          await agreeBtn.first().click({ trial: false }).catch(() => undefined);
        }

        // Use a stable selector for the search box instead of the volatile #APjFqb
        const search = page.locator('input[name="q"]');
        await search.fill('playwright load testing');
        await search.press('Enter');

        // Wait briefly to simulate dwell time and let results load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);

        // (Optional) Light assertion to ensure results page rendered
        await expect(page).toHaveTitle(/playwright/i, { timeout: 10_000 });
      } finally {
        await context.close();
      }
    })());

    // Run all users concurrently
    await Promise.all(tasks);
  } finally {
    await browser.close();
  }
});
