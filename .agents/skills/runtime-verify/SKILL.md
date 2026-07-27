---
name: runtime-verify
description: Verifica runtime obbligatoria dopo ogni implementazione in BUILD mode. Cattura console errors, network failures, overlay Next.js su 3+ pagine.
when-to-use: |
  - Dopo OGNI implementazione di codice in BUILD mode
  - Prima di compilare acceptance-report
  - Quando si modificano componenti condivisi, routing, layout, o globals.css
  - Quando si richiede test di funzionalità UI
  - PRIMA di dichiarare "test passato" o "implementazione completata"
  - MAI usare in PLAN mode (solo analisi, nessuna implementazione)
user-invocable: true
effort: medium
paths:
  - "app/**"
  - "components/**"
  - "styles/**"
  - "lib/**"
  - "hooks/**"
  - "stores/**"
---

# Runtime Verification Skill

Questa skill è **OBBLIGATORIA** dopo ogni implementazione in BUILD mode.

## Quando Usare

**USA questa skill quando:**
- Hai appena implementato codice (componenti, pagine, API routes)
- Stai per compilare l'acceptance-report
- Hai modificato file che influenzano l'UI o il runtime
- L'utente chiede di testare una funzionalità

**NON usare in:**
- PLAN mode (solo analisi, nessuna implementazione)
- Task di refactor puramente strutturale senza impatti runtime
- Documentazione o commenti

## Protocollo Obbligatorio

### 1. Turbopack Health Check

```bash
bash test-turbopack-check.sh
```

**Se fallisce:**
```bash
pkill -f next-server
rm -rf .next
npm run dev
# Attendi 10 secondi, poi riprovi il health check
```

### 2. Build Check

```bash
npm run build
```

**Se fallisce:** Fix errori di compilazione, poi ripeti.

### 3. Verifica Browser (browser-goblin)

Per **OGNI** pagina da verificare (minimo 3):

#### a) Apri browser
```bash
browser_open http://localhost:3000/<pagina>
```

#### b) Cattura console errors
```bash
browser_console
```
**Criterio:** DEVE essere vuoto (senza errori critici). Warning di sviluppo sono accettabili.

Filtra errori benigni:
- `favicon.ico` 404
- `Failed to load resource: net::ERR_ABORTED`
- Warning di React DevTools

#### c) Cattura page errors
```bash
browser_errors
```
**Criterio:** DEVE essere vuoto.

#### d) Cattura network failures
```bash
browser_network
```
**Criterio:** DEVE essere vuoto (senza 4xx/5xx).

#### e) Verifica overlay Next.js
```bash
browser_eval("!!document.querySelector('#nextjs__container_build-error, #nextjs__container_errors, [data-nextjs-toast]')")
```
**Criterio:** DEVE essere `false`.

#### f) Screenshot visivo
```bash
browser_screenshot
```

#### g) Chiudi browser
```bash
browser_close
```

### 4. Pagine da Verificare (MINIMO 3)

**Obbligatorio:**
1. Pagina modificata (quella su cui stai lavorando)
2. `/` (homepage)
3. `/login`

**Se modifichi componenti condivisi, aggiungi:**
- `/tasks`
- `/settings/account`
- `/lobby/[id]` (se esiste)
- Altre pagine correlate

### 5. E2E Test (Fasi Critiche)

**ESEGUI se:**
- Modifichi componenti in `components/ui/`
- Modifichi `app/layout.tsx`
- Modifichi `app/globals.css`
- Modifichi routing (`middleware.ts`)
- Modifichi store Zustand (`stores/`)

```bash
npx playwright test --project=chromium --reporter=list
```

**Se test falliscono:**
- Analizza l'errore specifico (file:linea)
- Fixa il problema
- Riesegui i test finché non passano

### 6. Accettazione

**L'acceptance-report DEVE includere il blocco `runtimeVerification`:**

```json
"runtimeVerification": {
  "turbopackCheck": "passed|failed|skipped",
  "buildCheck": "passed|failed",
  "browserConsoleErrors": [],
  "browserPageErrors": [],
  "browserNetworkFailures": [],
  "nextjsOverlayDetected": false,
  "pagesChecked": ["/modified", "/", "/login"],
  "e2eRun": "passed|failed|skipped",
  "verifiedBy": "davinci|human|tester",
  "verificationTool": "browser-goblin|playwright-cli"
}
```

**REGOLA: Nessun agente può dichiarare successo senza questo blocco compilato.**

## Alternative: Tester Subagent

Per verifiche indipendenti (fresh context), usa il subagent `tester`:

```
subagent({
  agent: "tester",
  task: "Verifica runtime per [descrizione modifica]",
  context: "fresh"
})
```

Il tester:
- Ha context fresco (nessun bias)
- Esegue il protocollo completo
- Reporta PASS/FAIL/BLOCKER con evidenze

## Criteri di Successo

| Criterio | Target | Verifica |
|----------|--------|----------|
| Console errors | 0 errori critici | `browser_console` vuoto |
| Network failures | 0 errori 4xx/5xx | `browser_network` vuoto |
| Overlay Next.js | Non rilevato | `browser_eval` = false |
| Pagine verificate | ≥ 3 | `pagesChecked.length >= 3` |
| E2E test | Passati (se richiesti) | Exit code 0 |

## Errori Comuni

### Errore: "Non ho tempo per la verifica"
**Soluzione:** La verifica è obbligatoria. Senza di essa, l'acceptance-report è incompleto.

### Errore: "Ho verificato solo la pagina modificata"
**Soluzione:** Devi verificare ALMENO 3 pagine (modificata + homepage + login).

### Errore: "Ci sono warning nella console, ma sono ok"
**Soluzione:** I warning di sviluppo sono accettabili. Gli ERRORI no. Filtra solo i warning.

### Errore: "Non funziona browser-goblin"
**Soluzione:** Verifica che sia installato: `browser_open` deve funzionare. Se non funziona, installa con `pi install npm:browser-goblin`.

## Esempio Completo

```bash
# 1. Health check
bash test-turbopack-check.sh

# 2. Build
npm run build

# 3. Verifica /login
browser_open http://localhost:3000/login
browser_console  # Deve essere vuoto
browser_errors   # Deve essere vuoto
browser_network  # Deve essere vuoto
browser_eval("!!document.querySelector('#nextjs__container_build-error')")  # Deve essere false
browser_screenshot
browser_close

# 4. Verifica /
browser_open http://localhost:3000/
browser_console
browser_errors
browser_network
browser_eval("!!document.querySelector('#nextjs__container_build-error')")
browser_screenshot
browser_close

# 5. Verifica /tasks (se modificato)
browser_open http://localhost:3000/tasks
browser_console
browser_errors
browser_network
browser_eval("!!document.querySelector('#nextjs__container_build-error')")
browser_screenshot
browser_close

# 6. Compila acceptance-report con runtimeVerification block
```

## Risorse Correlate

- **Tester subagent:** `.agents/tester.md`
- **Script utility:** `scripts/verify-runtime.sh`
- **Report audit:** `report-testing-audit.md`
- **Piano implementazione:** `plans/testing-runtime-verification/plan.md`
