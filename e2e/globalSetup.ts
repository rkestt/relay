import { chromium, type Browser } from '@playwright/test';

/**
 * Pre-flight Turbopack health check.
 * Runs before all E2E tests to ensure dev server is healthy.
 * If Turbopack is corrupted, fails fast with clear instructions.
 */
export default async function globalSetup() {
  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    // Check health endpoint
    const healthResp = await page.goto('http://localhost:3000/api/health', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    if (!healthResp) {
      throw new Error('No response from /api/health');
    }

    const status = healthResp.status();
    
    // HTTP 500 = Turbopack compilation failure
    if (status === 500) {
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      throw new Error(
        `TURBOPACK COMPILATION FAILED (HTTP 500)\n\n` +
        `Body: ${body.substring(0, 200)}\n\n` +
        `Fix:\n` +
        `  1. pkill -f "next-server"\n` +
        `  2. rm -rf .next\n` +
        `  3. npm run dev\n` +
        `  4. Re-run tests`
      );
    }

    // HTTP 503 = Service unhealthy (DB/Auth issues)
    if (status === 503) {
      const body = await healthResp.json();
      console.warn('⚠ Health endpoint: 503 (service unhealthy)');
      if (body.checks?.database?.status === 'error') {
        console.warn('  Database connection failed - check Supabase');
      }
    }

    // Check login page loads
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for compilation errors to surface
    await page.waitForTimeout(2000);

    // Check for error overlay
    const hasOverlay = await page.evaluate(() => {
      return !!document.querySelector('#nextjs__container_build-error, [data-nextjs-toast]');
    });

    if (hasOverlay) {
      throw new Error(
        'TURBOPACK BUILD ERROR OVERLAY DETECTED\n\n' +
        'Fix: rm -rf .next && npm run dev'
      );
    }

    if (errors.length > 0) {
      console.warn('⚠ Pre-flight warnings:', errors);
    }

    console.log('✅ Turbopack pre-flight check passed');
  } catch (err) {
    console.error(' Turbopack pre-flight check failed:');
    console.error(err instanceof Error ? err.message : err);
    throw err;
  } finally {
    await browser.close();
  }
}
