import { test, expect } from '@playwright/test';
import { checkPageForTurbopackErrors } from './helpers/turbopack-health';

/**
 * Turbopack health check test suite.
 * Runs to catch cache corruption early.
 */
test.describe('Turbopack Health', () => {
  test('dev server is running (not 500 Turbopack error)', async ({ request }) => {
    const resp = await request.get('/api/health');
    // 503 = DB unhealthy (local dev), 500 = Turbopack compilation failed
    expect(resp.status(), `Health check: expected != 500, got ${resp.status()}`).not.toBe(500);
    
    const body = await resp.json();
    expect(body).toHaveProperty('status');
    expect(['healthy', 'unhealthy']).toContain(body.status);
  });

  test('login page loads without 500 errors', async ({ page }) => {
    await checkPageForTurbopackErrors(page, '/login');
  });

  test('no Turbopack error overlay in browser', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    const hasOverlay = await page.evaluate(() => {
      const overlay = document.querySelector(
        '#nextjs__container_build-error, [data-nextjs-toast], .next-error'
      );
      return !!overlay;
    });
    
    expect(hasOverlay, 'No Turbopack build error overlay should be present').toBeFalsy();
  });

  test('no console errors on login page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Filter out known benign errors
    const critical = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('Failed to load resource')
    );
    
    expect(critical, 'No critical console errors on login page').toEqual([]);
  });

  test('homepage loads for unauthenticated user', async ({ page }) => {
    await checkPageForTurbopackErrors(page, '/');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
