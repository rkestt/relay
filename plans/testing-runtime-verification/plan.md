# Piano: Runtime Verification System

> **Obiettivo:** Eliminare i falsi positivi degli agenti in BUILD mode catturando console errors, network failures, overlay Next.js, hydration errors e verificando multi-pagina prima di dichiarare successo.
> **Target:** 60% falsi positivi → 5%
> **Pastor vote:** 7/10 (approvato con prerequisiti)

---

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Browser engine | `agent-browser` (Vercel Labs) |
| Pi wrapper | `browser-goblin` v0.4.8 |
| CLI testing | `@playwright/cli` |
| Auditor | Nuovo subagent `tester` (fresh context) |
| E2E spec | Playwright (gia' esistenti) |
| Turbopack check | `test-turbopack-check.sh` (gia' esistente) |

---

## Architettura

```
BUILD STEP (dopo implementazione, PRIMA di acceptance-report)
  │
  ├─ 1. Turbopack health check
  │      test-turbopack-check.sh
  │
  ├─ 2. Build check
  │      npm run build
  │
  ├─ 3. Verifica Runtime (browser-goblin O Playwright CLI)
  │      3a. Apri browser su pagina modificata
  │      3b. Cattura console errors (browser_console)
  │      3c. Cattura page errors (browser_errors)
  │      3d. Cattura network failures (browser_network)
  │      3e. Verifica overlay Next.js (browser_eval)
  │      3f. Screenshot visivo (browser_screenshot)
  │      3g. Ripeti per: /, /login, +1 correlata
  │
  ├─ 4. E2E smoke (fasi critiche)
  │      npx playwright test --project=chromium --grep "smoke"
  │
  └─ 5. Acceptance report (CON runtimeVerification block)
```

---

## Task

### t-001: Installare agent-browser (prerequisito)

browser-goblin richiede `agent-browser` CLI come backend browser.

```bash
# Verifica Node.js >= 20
node -e "process.exit(Number(process.version.slice(1).split('.')[0]) < 20)"

# Installa agent-browser
npm install -g agent-browser
agent-browser install
```

**Verifica:** `agent-browser --version` funziona.

---

### t-002: Installare browser-goblin

```bash
pi install npm:browser-goblin
```

**Verifica:** `/browser-doctor` risponde OK, `browser_open` apre browser.

---

### t-003: Smoke test browser-goblin

Test manuale per verificare che browser-goblin funzioni con l'app:

```bash
# Apri browser headed su /login
# Verifica: browser_console restituisce messaggi
# Verifica: browser_errors restituisce errori
# Verifica: browser_network mostra richieste
# Verifica: browser_qa cattura 3 viewport
```

**Output atteso:** Console errors = 0 su /login in fresh state.

---

### t-004: Installare @playwright/cli

```bash
npm install -g @playwright/cli
npx playwright-cli --version
```

**Verifica:** `playwright-cli open http://localhost:3000` apre browser.

---

### t-005: Aggiornare AGENTS.md — sezione Verifica Runtime

Aggiungere nella sezione `## God — Orchestrator Pattern`:

```
## Verifica Runtime — Protocollo Obbligatorio

Dopo OGNI implementazione in BUILD mode, PRIMA di acceptance-report:

1. **Turbopack health:** Esegui `bash test-turbopack-check.sh`
   - Se fallisce: pkill next-server, rm -rf .next, npm run dev, riprova

2. **Build check:** `npm run build`
   - Se fallisce: fix errori di compilazione, ripeti

3. **Verifica browser (browser-goblin):**
   a. `browser_open http://localhost:3000/<pagina-modificata>`
   b. `browser_console` — DEVE essere vuoto (senza errori critici)
   c. `browser_errors` — DEVE essere vuoto
   d. `browser_network` — DEVE essere vuoto (senza 4xx/5xx)
   e. `browser_eval("!!document.querySelector('#nextjs__container_build-error')")` — DEVE essere false
   f. Ripeti su: / (homepage), /login, +1 pagina correlata

4. **Multi-pagina:** Almeno 3 pagine verificate (modificata + homepage + login)

5. **E2E (fasi critiche):** Se la modifica tocca componenti condivisi, routing, o layout:
   `npx playwright test --project=chromium`

6. **Accettazione:** acceptance-report DEVE includere `runtimeVerification` block
```

---

### t-006: Aggiornare acceptance-report schema

Aggiungere blocco obbligatorio `runtimeVerification` a TUTTI gli acceptance-report.

```json
"runtimeVerification": {
  "turbopackCheck": "passed|failed|skipped (reason)",
  "buildCheck": "passed|failed",
  "browserConsoleErrors": [],
  "browserPageErrors": [],
  "browserNetworkFailures": [],
  "nextjsOverlayDetected": false,
  "pagesChecked": ["/modified", "/", "/login"],
  "e2eRun": "passed|failed|skipped (reason)",
  "verifiedBy": "davinci|human|tester",
  "verificationTool": "browser-goblin|playwright-cli|web_screenshot"
}
```

---

### t-007: Creare subagent tester

Creare `.agents/tester.md`:

```yaml
---
name: tester
description: Runtime verification agent. Fresh context, executes E2E tests, captures runtime errors.
tools: read, bash, web_screenshot
defaultContext: fresh
systemPromptMode: replace
acceptance:
  level: verified
  review: required
---

Sei `tester`: l'auditor runtime indipendente.

Hai context FRESCO — non hai visto il codice implementato.
Nessun bias. Solo evidenze oggettive.

## Protocollo di Verifica

1. Assicurati che il dev server sia in esecuzione
   - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
   - Se non risponde: `npm run dev` in background

2. Turbopack health check
   - `bash test-turbopack-check.sh`
   - Se fallisce: segnala BLOCKER, non procedere

3. Verifica browser-goblin su 3 pagine
   - `browser_open http://localhost:3000/<pagina>`
   - `browser_console` -> reporta tutti gli errori
   - `browser_errors` -> reporta tutti i page errors
   - `browser_network` -> reporta tutti i network failures
   - `browser_eval("!!document.querySelector('#nextjs__container_build-error, #nextjs__container_errors, [data-nextjs-toast]')")` -> overlay?
   - Screenshot con `browser_screenshot`

4. Pagine da verificare (ALMENO 3):
   - La pagina modificata (se specificata)
   - / (homepage)
   - /login
   - Altre pagine correlate

5. E2E test (se richiesto)
   - `npx playwright test --project=chromium`
   - Reporta test falliti con file:linea

6. Report finale
   - Formato: `## Tester Report`
   - Stato: PASS / FAIL / BLOCKER
   - Evidenze: console log, network log, screenshot paths
```

---

### t-008: Aggiornare AGENTS.md — aggiungere tester

Nella tabella subagent:

```
| tester | Verifica runtime indipendente | Fresh context, browser-goblin + E2E, report PASS/FAIL/BLOCKER |
```

Nel flusso BUILD:

```
/build
  └─ God passa "Mode: BUILD" inline
  └─ human implementa (con specifica approvata)
  └─ pastor verifica implementazione
  └─ davinci implementa UI se necessario
  └─ **tester** verifica runtime (console, network, overlay, multi-pagina)  ← NUOVO
  └─ evangelist salva decisioni nel wiki
```

---

### t-009: Script smoke test finale

Creare script `verify-runtime.sh` che esegue LAZY l'intero flusso:

```bash
#!/usr/bin/env bash
# Runtime Verification — Lazy Mode
# Esegue la sequenza completa di verifica runtime.
set -euo pipefail

echo "=== Runtime Verification ==="

# 1. Turbopack health
echo "[1/4] Turbopack health..."
bash test-turbopack-check.sh || {
  echo "Turbopack fail — non bloccante per smoke"
}

# 2. Build
echo "[2/4] Build check..."
npm run build 2>&1 | tail -5

# 3. E2E smoke (grep: smoke-tag)
echo "[3/4] E2E smoke..."
npx playwright test --project=chromium --grep "smoke" --reporter=list 2>&1 | tail -10

# 4. Browser check via Playwright CLI
echo "[4/4] Playwright CLI browser check..."
npx playwright-cli open http://localhost:3000 --console --timeout 10000 || true

echo "=== Verifica completata ==="
```

---

### t-010: Test finale — ciclo rosso/verde per verifica

Validazione che il sistema funzioni:

**Test rosso:** Introdurre volutamente un console.error in una pagina, verificare che la verifica runtime lo catturi.

```bash
# Modifica temporanea: aggiungi console.error
echo "console.error('test-error-agent-verify');" >> app/page.tsx

# Esegui verifica runtime
# browser_console DEVE mostrare 'test-error-agent-verify'
# acceptance-report.runtimeVerification.browserConsoleErrors DEVE contenere l'errore

# Revert modifica
git checkout app/page.tsx
```

**Test verde:** Nessun errore, verifica runtime passa.

---

## Dipendenze Task

```
t-001 (agent-browser)
  ↓
t-002 (browser-goblin install)
  ↓
t-003 (smoke test)
  │
  ├── t-004 (playwright-cli)
  │     ↓
  ├── t-005 (AGENTS.md update)
  │     ↓
  ├── t-006 (acceptance schema)
  │     ↓
  ├── t-007 (tester agent)
  │     ↓
  ├── t-008 (AGENTS.md tester table)
  │     ↓
  ├── t-009 (verify-runtime.sh)
  │     ↓
  └── t-010 (test finale rosso/verde)
```

---

## Rischi e Mitigazioni

| Rischio | Prob | Impatto | Mitigazione |
|---------|------|---------|-------------|
| agent-browser chromium download ~200MB | Medium | Alto | Brew installa automaticamente; npm install -g agent-browser + agent-browser install |
| browser-goblin v0.4.8 bug | Low | Medio | Alternativa: @dreki-gg/pi-browser-tools (94KB, piu' stabile) |
| Playwright CLI API instabile | Low | Medio | Usare solo comandi base: open, console, screenshot, requests. Non dipendere da feature sperimentali |
| Tester subagent non viene chiamato da God | Medium | Alto | AGENTS.md aggiornato con protocollo obbligatorio. Acceptance-report con runtimeVerification REQUIRED |
| Falsi positivi persistono | Low | Alto | Test rosso/verde in t-010 valida il sistema |

---

## Metriche di Successo

| Criterio | Target | Verifica |
|----------|--------|----------|
| Console errors catturati | 99% | Test rosso: errore voluto viene sempre catturato |
| Network failures catturati | 99% | Test: break API endpoint, verify detected |
| Overlay Next.js rilevato | 100% | Test: break build, verify overlay detected |
| Multi-pagina verificata | Sempre 3+ | acceptance-report.pagesChecked.length >= 3 |
| E2E eseguiti per fasi critiche | Sempre | acceptance-report.e2eRun != "skipped" per componenti condivisi |
| Tester chiamato | Sempre | acceptance-report.verifiedBy contiene agente indipendente |
