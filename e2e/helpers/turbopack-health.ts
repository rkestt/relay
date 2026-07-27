/**
 * Turbopack Health Check Helper for E2E Tests
 * 
 * Detects Turbopack cache corruption and compilation failures.
 * Use before running test suites to fail fast with clear fix instructions.
 */

import { request as playwrightRequest, type Page, type APIRequestContext } from '@playwright/test';

export interface TurbopackHealth {
  healthy: boolean;
  httpStatus: number;
  errors: string[];
  recommendations: string[];
}

/**
 * Check if Turbopack dev server is healthy.
 * Returns detailed health report.
 */
export async function checkTurbopackHealth(
  baseURL: string = 'http://localhost:3000'
): Promise<TurbopackHealth> {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let httpStatus = 0;

  const browser = await playwrightRequest.newContext({ baseURL });

  try {
    // 1. Check /api/health endpoint
    const healthResp = await browser.get('/api/health');
    httpStatus = healthResp.status();

    if (httpStatus === 500) {
      const body = await healthResp.text();
      errors.push('HTTP 500: Turbopack compilation failed');
      errors.push(`Response: ${body.substring(0, 200)}`);
      recommendations.push('Run: pkill -f "next-server" && rm -rf .next && npm run dev');
    } else if (httpStatus === 503) {
      const body = await healthResp.json();
      errors.push('HTTP 503: Service unhealthy');
      if (body.checks?.database?.status === 'error') {
        errors.push('Database connection failed');
        recommendations.push('Check Supabase local dev: docker ps');
      }
    }

    // 2. Check login page loads (not 500)
    const loginResp = await browser.get('/login');
    if (loginResp.status() === 500) {
      errors.push('Login page returns 500 (Turbopack error)');
      recommendations.push('Clear .next cache and restart dev server');
    }

    // 3. Check for known Turbopack error patterns
    if (errors.length > 0) {
      recommendations.push(
        'Turbopack cache corruption detected. This is a known issue with Next.js 16.',
        'See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache'
      );
    }

  } catch (err) {
    errors.push(`Health check failed: ${err instanceof Error ? err.message : err}`);
    recommendations.push('Ensure dev server is running: npm run dev');
  } finally {
    await browser.dispose();
  }

  return {
    healthy: errors.length === 0 && httpStatus === 200,
    httpStatus,
    errors,
    recommendations,
  };
}

/**
 * Assert Turbopack is healthy. Throws with fix instructions if not.
 */
export async function assertTurbopackHealthy(baseURL?: string): Promise<void> {
  const health = await checkTurbopackHealth(baseURL);

  if (!health.healthy) {
    console.error('\n❌ TURBOPACK HEALTH CHECK FAILED\n');
    console.error('Errors:');
    health.errors.forEach(e => console.error(`  - ${e}`));
    
    if (health.recommendations.length > 0) {
      console.error('\n🔧 Recommendations:');
      health.recommendations.forEach(r => console.error(`  ${r}`));
    }
    
    console.error('\n📚 Fix Turbopack cache corruption:');
    console.error('  1. pkill -f "next-server"');
    console.error('  2. rm -rf .next');
    console.error('  3. npm run dev');
    console.error('  4. Re-run tests\n');
    
    throw new Error(`Turbopack unhealthy: ${health.errors.join('; ')}`);
  }

  console.log('✅ Turbopack health check passed');
}

/**
 * Check page for Turbopack compilation errors.
 * Use in test suites to catch errors early.
 */
export async function checkPageForTurbopackErrors(page: Page, url: string): Promise<void> {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });

  if (!resp) {
    throw new Error(`No response from ${url}`);
  }

  // HTTP 500 = Turbopack compilation failure
  if (resp.status() === 500) {
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    throw new Error(
      `TURBOPACK COMPILATION FAILED on ${url}\n` +
      `HTTP 500 - Body: ${bodyText.substring(0, 300)}\n\n` +
      `Fix:\n` +
      `  1. pkill -f "next-server"\n` +
      `  2. rm -rf .next\n` +
      `  3. npm run dev\n` +
      `  4. Re-run tests`
    );
  }

  // Check for Next.js build error overlay
  const hasOverlay = await page.evaluate(() => {
    return !!document.querySelector('#nextjs__container_build-error, [data-nextjs-toast]');
  });

  if (hasOverlay) {
    throw new Error(
      `TURBOPACK BUILD ERROR OVERLAY on ${url}\n\n` +
      `Fix: rm -rf .next && npm run dev`
    );
  }
}

/**
 * Enable Turbopack FileSystem Cache in next.config.ts.
 * Call this to get config snippet.
 */
export function getTurbopackCacheConfig(): string {
  return `
// Add to next.config.ts experimental section:
experimental: {
  turbopackFileSystemCacheForDev: true,
  turbopackFileSystemCacheForBuild: true,
}
`;
}
