NON CREARE CLAUDE.MD, non sei claude code

# Protocollo di Debug Runtime con Playwright

Questo protocollo è mandatorio quando viene segnalato un errore runtime (console error, fetch fallito, UI rotta, crash di pagina). L'ispezione runtime ha priorità assoluta sull'analisi del codice statico.

## Regole Tassative per l'Agent

* **No Blind Guessing:** È vietato cercare nel codice statico o fare supposizioni prima di aver verificato il comportamento runtime con Playwright.
* **No Domande Inutili:** Non chiedere all'utente screenshot o log della console. Usa Playwright per raccoglierli autonomamente.
* **Isolamento Network:** In caso di `Failed to fetch`, analizza esclusivamente il network layer (CORS, endpoint down, status 4xx/5xx). Non modificare il codice del componente prima di questa verifica.

---

## Prassi Standard di Diagnostica

Esegui questi passaggi in ordine prima di modificare qualsiasi file:

1. **Avvio:** Esegui `npx playwright test --debug` o uno script di diagnostica locale.
2. **Raccolta Evidenze:** Estrai nell'ordine:
   * Console errors (`page.on('console', ...)`)
   * Network failures (`page.on('requestfailed', ...)`)
   * Screenshot dello stato visivo (`page.screenshot()`)
   * Snapshot del DOM (`page.content()`)
3. **Risoluzione:** Identifica il problema dai log runtime e procedi al fix sul codice statico solo come ultimo step.

---

## Verifica Runtime — Protocollo Obbligatorio

Dopo **OGNI** implementazione in BUILD mode, **PRIMA** di acceptance-report:

### 1. Turbopack Health Check
```bash
bash test-turbopack-check.sh
```
Se fallisce:
```bash
pkill -f next-server
rm -rf .next
npm run dev
# Riprovi il health check
```

### 2. Build Check
```bash
npm run build
```
Se fallisce: fix errori di compilazione, poi ripeti.

### 3. Verifica Browser (browser-goblin)

**Per ogni pagina modificata + homepage + login:**

a) Apri browser:
```bash
browser_open http://localhost:3000/<pagina-modificata>
```

b) Cattura console errors:
```bash
browser_console
```
**DEVE essere vuoto** (senza errori critici). Warning di sviluppo sono accettabili.

c) Cattura page errors:
```bash
browser_errors
```
**DEVE essere vuoto.**

d) Cattura network failures:
```bash
browser_network
```
**DEVE essere vuoto** (senza 4xx/5xx).

e) Verifica overlay Next.js:
```bash
browser_eval("!!document.querySelector('#nextjs__container_build-error, #nextjs__container_errors, [data-nextjs-toast]')")
```
**DEVE essere false.**

f) Screenshot visivo:
```bash
browser_screenshot
```

### 4. Multi-Pagina Verification
Verifica **ALMENO 3 pagine**:
- Pagina modificata
- `/` (homepage)
- `/login`
- Altre pagine correlate se rilevanti

### 5. E2E Test (Fasi Critiche)
Se la modifica tocca **componenti condivisi, routing, o layout**:
```bash
npx playwright test --project=chromium
```

### 6. Acceptance Report
L'acceptance-report **DEVE** includere il blocco `runtimeVerification`:
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
  "verificationTool": "browser-goblin|playwright-cli"
}
```

**Nessun agente può dichiarare successo senza questo blocco compilato.**

---

## Subagent: Tester (Runtime Verification)

| Agente | Ruolo | Strumenti |
|--------|-------|-----------|
| **tester** | Verifica runtime indipendente | Fresh context, browser-goblin + E2E, report PASS/FAIL/BLOCKER |

### Flusso BUILD con Tester

```
/build
  └─ God passa "Mode: BUILD" inline
  └─ human implementa (con specifica approvata)
  └─ pastor verifica implementazione
  └─ davinci implementa UI se necessario
  └─ **tester** verifica runtime (console, network, overlay, multi-pagina)
  └─ evangelist salva decisioni nel wiki
```

**Quando chiamare tester:**
- Dopo OGNI implementazione in BUILD mode (obbligatorio)
- Per verifiche multi-pagina (homepage + /login + pagina modificata)
- Per E2E test su componenti condivisi

**Output tester:** Report strutturato con evidenze oggettive (console log, network log, screenshot)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).