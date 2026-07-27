import { chromium } from 'playwright';

/**
 * Check Turbopack health before running tests.
 * Returns: { healthy: boolean, errors: string[], httpStatus: number }
 */
export async function checkTurbopackHealth(url = 'http://localhost:3000') {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  let httpStatus = 0;
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  // Capture page errors
  page.on('pageerror', err => errors.push(`PageError: ${err.message}`));
  
  // Capture network failures
  page.on('requestfailed', req => {
    errors.push(`NetworkFail: ${req.url()} -> ${req.failure()?.errorText}`);
  });
  
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    httpStatus = response?.status() ?? 0;
    
    // Wait for any compilation errors to appear
    await page.waitForTimeout(3000);
    
    // Check for Next.js error overlay
    const hasOverlay = await page.evaluate(() => {
      const overlay = document.querySelector('#nextjs__container_build-error, [data-nextjs-toast]');
      return !!overlay;
    });
    
    if (hasOverlay) {
      errors.push('Next.js build error overlay detected');
    }
    
    // Check for 500 errors (Turbopack compilation failure)
    if (httpStatus === 500) {
      const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
      errors.push(`HTTP 500 - Turbopack compilation failed: ${bodyText.substring(0, 200)}`);
    }
    
  } catch (err) {
    errors.push(`Navigation error: ${err.message}`);
  }
  
  await browser.close();
  
  return {
    healthy: errors.length === 0 && httpStatus === 200,
    errors,
    httpStatus,
  };
}

/**
 * Assert Turbopack is healthy before test.
 * Throws if not healthy.
 */
export async function assertTurbopackHealthy(url = 'http://localhost:3000') {
  const result = await checkTurbopackHealth(url);
  
  if (!result.healthy) {
    console.error('❌ Turbopack NOT healthy:');
    result.errors.forEach(e => console.error('  -', e));
    console.error('\n🔧 Fix: kill next-server processes, rm -rf .next, npm run dev');
    throw new Error(`Turbopack unhealthy: ${result.errors.join(', ')}`);
  }
  
  console.log('✅ Turbopack healthy');
  return result;
}

// CLI usage: node turbopack-check.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await checkTurbopackHealth();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.healthy ? 0 : 1);
}
