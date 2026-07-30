# Turbopack Error Pattern Catalog

Patterns are ordered by frequency. Each entry describes the symptom,
the root cause, the detection method, and the fix.

---

## P001 — PostCSS plugin not found

**Symptom**: Page 500, body contains JSON with `Cannot find module '@tailwindcss/postcss'`

**Detection**:
```
cat turbopack.log                    # Nothing useful
.next/dev/logs/next-development.log  # EROR: Cannot find module '@tailwindcss/postcss'
npx playwright test e2e/health.spec  # 500 con stack trace nel body
```

**Root cause**: `@tailwindcss/postcss` in `package.json` devDependencies but not
in `node_modules`. Can happen after `npm uninstall` removes shared transitive,
or after `npm ci` without `--dev`, or manual `node_modules` corruption.

**Fix**:
```bash
npm install @tailwindcss/postcss
```

**Verify**: `npx playwright test e2e/health.spec.ts`

---

## P002 — Webpack-only PWA plugin on Turbopack

**Symptom**: `workbox-webpack-plugin` errors, build loops, or HMR freeze.
Next.js dev server starts but never finishes compiling.

**Detection**:
```
# Terminal shows "Ready" but browser never loads
# Or turbopack.log shows webpack-related require errors
.next/dev/logs/next-development.log  # "Cannot find module 'workbox-webpack-plugin'"
```

**Root cause**: PWA packages like `@ducanh2912/next-pwa`, `next-pwa`, or
`@serwist/next` (older versions) inject webpack configuration that Turbopack
ignores or crashes on.

**Fix options** (choose one):

A) **Remove PWA** (if SW non essenziale):
```bash
npm uninstall @ducanh2912/next-pwa next-pwa
# Rimuovi withPWA() da next.config.*
```

B) **Migrate to Turbopack-compatible PWA**:
```bash
npm install @serwist/next@latest
# Segui docs: https://serwist.pages.dev/docs/next
```

C) **Fallback a webpack** (se PWA indispensabile e serwist non basta):
```javascript
// next.config.ts
const nextConfig = {
  // ...rest
};
// Remove --turbo, use webpack
```

**Verify**: `npx playwright test e2e/health.spec.ts`

---

## P003 — Middleware convention deprecated

**Symptom**: Dev server startup shows:
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**Detection**:
```
turbopack.log  # Contains the deprecation warning
```

**Root cause**: Next.js 16 renamed `middleware.ts` to `proxy.ts`. The old name
still works but warns.

**Fix**:
```bash
mv middleware.ts proxy.ts
# Edit proxy.ts: rename function from "middleware" to "proxy"
```

**Verify**: Riavvia dev server, warning sparito.

---

## P004 — NODE_ENV non-standard

**Symptom**:
```
⚠ You are using a non-standard "NODE_ENV" value in your environment.
```

**Detection**: Present in turbopack.log at startup.

**Root cause**: Global shell sets `NODE_ENV=production` (or other value).
With `next dev`, Next.js expects `development`.

**Fix**: Non puoi forzarlo da `.env` (Next.js lo blocca). Devi preporlo:
```json
// package.json scripts
"dev": "NODE_ENV=development next dev",
"dev:log": "NODE_ENV=development next dev --turbo > turbopack.log 2>&1"
```

Oppure unset dalla shell: `unset NODE_ENV && npm run dev`

**Verify**: Warning assente al prossimo avvio.

---

## P005 — Error only visible in browser (silent Turbopack crash)

**Symptom**: Terminal shows `✓ Ready`, page shows blank/500, no obvious
error in terminal.

**Detection**: Solo Playwright lo cattura:
```bash
npx playwright test e2e/health.spec.ts  # Fallisce
cat .next/dev/logs/next-development.log  # JSON con stack trace
```

**Root cause**: Turbopack compila in modo lazy — errore emerge solo
quando un browser richiede il modulo rotto (es. CSS, layout, page).

**Fix**: Dipende dall'errore specifico. Usa il body della risposta 500
(contiene JSON con `err.message` e `err.stack`) per diagnosticare.

**Verify**: Playwright test passa.

---

## P006 — Port conflict

**Symptom**:
```
⚠ Port 3000 is in use by process X, using available port 3001 instead.
```

**Detection**: turbopack.log

**Root cause**: Previous dev server still running.

**Fix**:
```bash
kill $(lsof -ti :3000)
```

**Verify**: Riavvia, port 3000 libero.

---

## P007 — Slow filesystem

**Symptom**:
```
⚠ Slow filesystem detected. The benchmark took Xms.
```

**Detection**: turbopack.log at startup.

**Root cause**: `.next/` su filesystem lento (es. mount di rete, Docker volume,
HDD esterno).

**Fix**: Sposta `.next/` su SSD locale o aggiungi a `.gitignore` e cancella
periodicamente. Non blocca, ma degrada performance.

**Verify**: Warning solo informativo.

---

## P008 — Version staleness

**Symptom**: Next.js error page shows "Next.js X.X.X (stale)" with link.

**Detection**: Playwright probe cattura il link nel body.

**Root cause**: next package non aggiornato con ultima versione stabile.

**Fix**:
```bash
npm install next@latest
```

**Verify**: Riavvia, versione aggiornata.

---

## P009 — npm install doesn't extract packages (npm 11 bug)

**Symptom**: `npm install` completes successfully but packages are missing from
`node_modules`. `npm ls <package>` shows `(empty)`. The `@tailwindcss/postcss`
or `tailwindcss` packages (and their transitive deps) are in `package.json`
and `package-lock.json` but not actually in `node_modules/`.

**Detection**:
```bash
ls node_modules/@tailwindcss/postcss/package.json  # No such file
find node_modules -name 'tailwindcss' -type d        # Nothing
npm ls @tailwindcss/postcss                          # (empty)
```

**Root cause**: npm 11.x bug on Node 24 where content-addressable store entries
exist but symlink/copy to node_modules fails silently. Common after:
- `npm uninstall` that prunes shared transitive deps
- Manual edits to `package-lock.json`
- Cache corruption from previous failed installs

**Fix**:
```bash
# 1. Clean slate
rm -rf node_modules package-lock.json

# 2. Reinstall (may need multiple attempts or --no-optional)
npm install --no-optional --ignore-scripts

# 3. If still missing, install individually in temp and copy
npm pack @tailwindcss/postcss@latest
mkdir -p /tmp/extract && tar xzf tailwindcss-postcss-*.tgz -C /tmp/extract
cp -r /tmp/extract/package/* node_modules/@tailwindcss/postcss/
# Repeat for transitive deps listed in require stack trace
```

**Verify**: `npm ls @tailwindcss/postcss` mostra versione.

---

## P010 — First compile slow on cold start

**Symptom**: After `rm -rf .next`, the first page load takes 10-15 seconds.
Subsequent loads are instant.

**Detection**:
```
turbopack.log shows: GET /login 200 in 12.4s
                 (next.js: 11.7s, proxy.ts: 3ms, application-code: 689ms)
```

**Root cause**: Turbopack needs to compile and cache all modules on first
request. This is normal after `.next/` cache clear.

**Fix**: Nessuno. È normale. Il secondo load è <100ms.

**Verify**: Ricarica la pagina.
