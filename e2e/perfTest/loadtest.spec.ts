// tests/load.spec.ts
import { test, expect, chromium } from '@playwright/test';
import { LoginPage } from '../../pages/loginpage';

test('concurrent login load test', async () => {
  const concurrentUsers = Number(process.env.CONCURRENCY || 10);
  const rampUpMs = Number(process.env.RAMP_UP_MS || 0); // e.g., 200 means 200ms stagger
  const username = process.env.LOGIN_USER || 'Admin';
  const password = process.env.LOGIN_PASS || 'admin123';

  const browser = await chromium.launch({ headless: true });

  const results: { i: number; ok: boolean; ms: number; err?: string }[] = [];
  const startAll = Date.now();

  try {
    const tasks = Array.from({ length: concurrentUsers }, (_, i) => (async () => {
      const started = Date.now();
      const context = await browser.newContext({
        // userAgent: `load-test-agent-${i}`,
        // locale: i % 2 === 0 ? 'en-US' : 'en-GB',
      });
      const page = await context.newPage();

      // Optional staggered start
      if (rampUpMs > 0) await new Promise(r => setTimeout(r, i * rampUpMs));

      try {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.loginToHomePage(username, password);

        // Assert some post-login signal
        await expect(page).toHaveURL(/dashboard|home/i, { timeout: 15_000 });
        await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10_000 });

        results.push({ i, ok: true, ms: Date.now() - started });
      } catch (e: any) {
        results.push({ i, ok: false, ms: Date.now() - started, err: e?.message || String(e) });
        throw e;
      } finally {
        await context.close();
      }
    })());

    // Prevent one rejection from aborting the rest
    const settled = await Promise.allSettled(tasks);

    const totalMs = Date.now() - startAll;
    const successes = results.filter(r => r.ok).length;
    const failures = results.length - successes;
    const durations = results.map(r => r.ms).sort((a, b) => a - b);
    const p = (q: number) => durations[Math.min(durations.length - 1, Math.floor(q * durations.length))];

    // Emit some basic load metrics into test output
    console.log(`\n--- Load Summary ---`);
    console.log(`Users: ${concurrentUsers}, Ramp-up: ${rampUpMs}ms, Total wall time: ${totalMs} ms`);
    console.log(`Success: ${successes}, Failures: ${failures}`);
    if (durations.length) {
      console.log(`p50: ${p(0.5)} ms, p90: ${p(0.9)} ms, max: ${durations[durations.length - 1]} ms`);
    }
    const failed = results.filter(r => !r.ok);
    if (failed.length) {
      console.log(`Failures:`);
      failed.slice(0, 5).forEach(f => console.log(`#${f.i} -> ${f.err}`));
    }

    // Make the test fail if any failed
    const anyRejected = settled.some(s => s.status === 'rejected');
    expect(anyRejected, `Some user iterations failed: ${failed.length}`).toBeFalsy();
  } finally {
    await browser.close();
  }
});