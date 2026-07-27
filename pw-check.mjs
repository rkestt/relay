import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const networkFailures = [];
const allConsole = [];

page.on('console', msg => {
  allConsole.push({ type: msg.type(), text: msg.text() });
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

page.on('requestfailed', req => {
  networkFailures.push({ url: req.url(), failure: req.failure()?.errorText });
});

// Go to login
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });

// Fill credentials
await page.fill('input[type="email"]', 'test@relay.com');
await page.fill('input[type="password"]', 'testpass123');

// Click sign in
await page.click('button[type="submit"]');

// Wait for navigation
await page.waitForTimeout(5000);

// Screenshot after login
await page.screenshot({ path: '/tmp/r6hub-home-auth.png', fullPage: false });
console.log('Screenshot saved to /tmp/r6hub-home-auth.png');

console.log('\n=== CURRENT URL ===');
console.log(page.url());

console.log('\n=== CONSOLE ERRORS ===');
if (consoleErrors.length === 0) console.log('(none)');
else consoleErrors.forEach(e => console.log('  -', e));

console.log('\n=== ALL CONSOLE ===');
allConsole.forEach(m => console.log(`  [${m.type}]`, m.text));

console.log('\n=== NETWORK FAILURES ===');
if (networkFailures.length === 0) console.log('(none)');
else networkFailures.forEach(f => console.log(`  - ${f.url} (${f.failure})`));

// Get visible text
const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 3000));
console.log('\n=== VISIBLE TEXT ===');
console.log(bodyText);

// Check for any error overlays or "issues" indicators
const errorOverlays = await page.evaluate(() => {
  const overlays = document.querySelectorAll('[data-nextjs-error], .next-error, [role="alert"], .error-overlay');
  return Array.from(overlays).map(el => el.textContent?.trim());
});
console.log('\n=== ERROR OVERLAYS ===');
if (errorOverlays.length === 0) console.log('(none)');
else errorOverlays.forEach(e => console.log('  -', e));

// Check for any build indicators or dev overlays
const buildIndicators = await page.evaluate(() => {
  // Look for any fixed/sticky elements that might be dev indicators
  const fixed = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
  return Array.from(fixed).map(el => ({
    tag: el.tagName,
    text: el.textContent?.trim().substring(0, 200),
    classes: el.className
  }));
});
console.log('\n=== FIXED ELEMENTS (dev indicators?) ===');
if (buildIndicators.length === 0) console.log('(none)');
else buildIndicators.forEach(e => console.log('  -', e.tag, e.text));

await browser.close();
