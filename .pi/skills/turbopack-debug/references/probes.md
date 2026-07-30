# Probe Test Templates

Template per test Playwright che catturano errori silenziosi di Turbopack.
Salva in `e2e/probes/` ed esegui con `npx playwright test e2e/probes/`.

## health.spec.ts — Test base (obbligatorio)

```typescript
import { test, expect } from '@playwright/test';

// Verifica che l'app risponda (anche con redirect)
test('app loads', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Se redirect, il test passa comunque — l'app è viva
  expect(await page.textContent('body')).toBeTruthy();
});

// Verifica che pagine statiche esistano
test.each(['/manifest.json', '/robots.txt', '/sitemap.xml'])(
  'static file %s returns 200',
  async ({ page }, path) => {
    const resp = await page.goto(path, { waitUntil: 'networkidle' });
    expect(resp?.status()).toBe(200);
  }
);

// Verifica nessun console.error
test('no console errors on load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
```

## probe-pages.spec.ts — Scopri errori su pagine specifiche

```typescript
import { test, expect } from '@playwright/test';

// Lista pagine da testare (aggiorna da messiah output)
const PAGES = [
  '/',
  '/login',
  '/auth/callback',
  '/lobby',
  '/strategies',
];

for (const path of PAGES) {
  test(`${path} loads without 500`, async ({ page }) => {
    const resp = await page.goto(path, { waitUntil: 'networkidle' });
    const status = resp?.status() ?? 0;

    if (status === 500) {
      // Cattura errore dal body JSON
      const body = await page.textContent('body');
      console.error(`=== 500 on ${path} ===`);
      console.error(body);
    }

    // 200, 301, 302, 307, 404 sono accettabili
    // Solo 500 è bloccante
    expect(status).not.toBe(500);
  });
}
```

## probe-api.spec.ts — Test API routes

```typescript
import { test, expect } from '@playwright/test';

const API_ROUTES = [
  '/api/health',
  '/api/session',
];

for (const path of API_ROUTES) {
  test(`API ${path} returns valid response`, async ({ page }) => {
    const resp = await page.goto(path, { waitUntil: 'networkidle' });
    expect(resp?.ok()).toBeTruthy();
  });
}
```

## Troubleshooting

### La pagina dà 500 con JSON nel body

```typescript
// Il body contiene un JSON con { err: { message, stack } }
// Estrarlo così:
const jsonMatch = await page.evaluate(() => {
  const text = document.body?.textContent || '';
  try { return JSON.parse(text); } catch { return null; }
});
if (jsonMatch?.err) {
  console.error('ERROR MESSAGE:', jsonMatch.err.message);
  console.error('STACK:', jsonMatch.err.stack);
}
```

### Test fallisce per timeout (pagina non carica)

```bash
# Controlla se il server risponde
curl -sI http://localhost:3000/

# Controlla errori nel log
grep ERROR .next/dev/logs/next-development.log
```
