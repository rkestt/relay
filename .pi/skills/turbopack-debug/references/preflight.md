# Preflight Checklist

Esegui prima di iniziare il loop. Se qualcosa manca, fermati e installa.

## 1. Playwright

```bash
# Installato?
npx playwright --version

# Browser installato?
ls ~/.cache/ms-playwright/

# Se manca:
npm install --save-dev @playwright/test
npx playwright install chromium
```

## 2. Config

```bash
ls playwright.config.ts
# Se manca, crea:
cat > playwright.config.ts << 'EOF'
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000' },
  webServer: process.env.CI ? {
    command: 'npm run dev', url: 'http://localhost:3000',
    reuseExistingServer: true, stdout: 'pipe', stderr: 'pipe',
  } : undefined,
});
EOF
```

## 3. Health Test

```bash
ls e2e/health.spec.ts
# Se manca, crea da references/probes.md
```

## 4. Dev Scripts

```bash
grep '"dev:log"' package.json
# Se manca, aggiungi a package.json scripts:
# "dev:log": "NODE_ENV=development next dev --turbo > turbopack.log 2>&1"
# "test:e2e": "playwright test"
```

## 5. Gitignore

```bash
grep 'turbopack.log' .gitignore
# Se manca, aggiungi:
# turbopack.log
```

## 6. Kill stale server

```bash
kill $(lsof -ti :3000) 2>/dev/null || echo "no server on :3000"
```

## 7. Clean stale caches (opzionale)

```bash
rm -rf .next test-results playwright-report
```
