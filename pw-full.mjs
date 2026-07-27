import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const allConsole = [];
const networkFailures = [];

page.on('console', msg => allConsole.push({ type: msg.type(), text: msg.text() }));
page.on('requestfailed', req => networkFailures.push({ url: req.url(), failure: req.failure()?.errorText }));

// Login
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
await page.fill('input[type="email"]', 'test@relay.com');
await page.fill('input[type="password"]', 'testpass123');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

// Full page screenshot including bottom of screen
await page.screenshot({ path: '/tmp/r6hub-full.png', fullPage: true });
console.log('Full screenshot saved');

// Get HTML of bottom-left area (where dev indicators appear)
const bottomLeft = await page.evaluate(() => {
  // Next.js puts error indicators in fixed position elements
  const all = document.querySelectorAll('*');
  const fixed = [];
  for (const el of all) {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && el.children.length < 10) {
      fixed.push({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 100),
        class: el.className?.toString()?.substring(0, 100),
        id: el.id,
        style: el.getAttribute('style')?.substring(0, 200),
      });
    }
  }
  return fixed;
});
console.log('\n=== FIXED POSITION ELEMENTS ===');
console.log(JSON.stringify(bottomLeft, null, 2));

// Check for nextjs build overlay
const nextjsOverlay = await page.evaluate(() => {
  const el = document.querySelector('#nextjs__container_build-error, #nextjs__container_errors, [data-nextjs-toast], [data-nextjs-dev-tools]');
  return el ? { tag: el.tagName, text: el.textContent?.substring(0, 500), outerHTML: el.outerHTML?.substring(0, 500) } : null;
});
console.log('\n=== NEXTJS OVERLAY ===');
console.log(nextjsOverlay);

// Check bottom-left corner specifically (100x100 area)
const corner = await page.screenshot({ path: '/tmp/r6hub-corner.png', clip: { x: 0, y: 800, width: 200, height: 200 } });

// Get all text near bottom of viewport
const bottomText = await page.evaluate(() => {
  const els = document.elementsFromPoint(50, 850);
  return els.map(el => ({ tag: el.tagName, text: el.textContent?.trim().substring(0, 50), class: el.className?.toString()?.substring(0, 50) }));
});
console.log('\n=== ELEMENTS AT BOTTOM-LEFT (50,850) ===');
console.log(JSON.stringify(bottomText, null, 2));

// Check if there are any Next.js build/compile errors in the page
const buildErrors = await page.evaluate(() => {
  // Look for the Next.js error toast / build indicator
  const toasts = document.querySelectorAll('[data-radix-toast-viewport], .next-toast, .turbopack-error, [style*="z-index"]');
  return Array.from(toasts).map(el => ({
    tag: el.tagName,
    text: el.textContent?.trim().substring(0, 200),
    zIndex: window.getComputedStyle(el).zIndex,
    position: window.getComputedStyle(el).position,
  }));
});
console.log('\n=== TOASTS/Z-INDEX ELEMENTS ===');
console.log(JSON.stringify(buildErrors, null, 2));

// Console summary
console.log('\n=== CONSOLE ERRORS ===');
const errors = allConsole.filter(m => m.type === 'error');
if (errors.length === 0) console.log('(none)');
else errors.forEach(e => console.log('  -', e.text));

console.log('\n=== NETWORK FAILURES ===');
if (networkFailures.length === 0) console.log('(none)');
else networkFailures.forEach(f => console.log(`  - ${f.url} (${f.failure})`));

// Count all console messages
console.log('\n=== CONSOLE SUMMARY ===');
console.log(`Total: ${allConsole.length} messages (${errors.length} errors)`);

await browser.close();
