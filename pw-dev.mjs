import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const allConsole = [];
page.on('console', msg => allConsole.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => console.log('[PAGE_ERROR]', err.message));
page.on('requestfailed', req => console.log('[FAIL]', req.url(), req.failure()?.errorText));

// Navigate to login
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Screenshot
await page.screenshot({ path: '/tmp/r6hub-login-fresh.png' });
console.log('Login screenshot saved');

// Find inputs and login
const inputs = await page.evaluate(() => {
  const els = document.querySelectorAll('input');
  return Array.from(els).map(el => ({ type: el.type, name: el.name, placeholder: el.placeholder }));
});
console.log('Inputs:', JSON.stringify(inputs));

await page.fill('input[type="email"]', 'test@relay.com');
await page.fill('input[type="password"]', 'testpass123');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

// Navigate home
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

await page.screenshot({ path: '/tmp/r6hub-home-fresh.png' });
console.log('Home screenshot saved');

// Console errors
const errors = allConsole.filter(m => m.type === 'error');
console.log('\n=== CONSOLE ERRORS ===');
if (errors.length === 0) console.log('(none)');
else errors.forEach(e => console.log('  -', e.text));

// URL
console.log('\nCurrent URL:', page.url());

// Visible text
const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 1500));
console.log('\n=== VISIBLE TEXT ===');
console.log(bodyText);

await browser.close();
