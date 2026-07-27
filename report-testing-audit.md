# Audit: Sistema di Testing Agenti — r6hub

> **Data:** 2026-07-26
> **Pastor Review:** Voto 6/10 (diagnosi solida, prescrizione fragile). Vedi appendice in fondo.
> **Scopo:** Identificare perche' gli agenti dichiarano "funziona" mentre l'umano trova bug (errori runtime Next.js/Turbopack, hydration, overlay, console, ecc.)
> **Output:** Report + Raccomandazioni

---

## Stato Attuale

### Stack Agenti
- **Orchestrator:** pi-coding-agent con estensione `pi-subagents`
- **Subagenti:** messiah (recon), evangelist (wiki), human (implementazione), davinci (UI/UX), pastor (architettura)
- **Mode:** PLAN/BUILD via `@dreki-gg/pi-plan-mode`
- **Skills:** impeccable, hallmark, grill-me, supabase
- **Verifica accettazione:** `acceptance-report` con changed-files, commands-run, residual-risks

### Stack App
- Next.js 16.2.6 + React 19 + Tailwind v4 + shadcn/ui
- 17+ pagine, auth Supabase, realtime, PWA
- E2E: Playwright 1.61, 4 spec files, 1 globalSetup
- MCP servers: **nessuno configurato**
- Scripts runtime: pw-check.mjs, pw-dev.mjs, pw-full.mjs (usano Playwright direttamente)

### Flusso BUILD tipico
```
God -> task a davinci/human (fork context)
  |- davinci/human implementa codice
  |- davinci: web_screenshot per verifica visiva
  |- Se build passa -> "AcceptanceReport" -> successo
  |- pastor NON verifica dopo BUILD (solo in PLAN)
  |- E2E test NON eseguiti
  |- Nessuna verifica console/browser runtime
```

---

## Problemi Individuati

### P1 — web_screenshot non rivela errori runtime
Il tool `web_screenshot` cattura un'immagine della pagina ma **non cattura**:
- Console errors
- Network failures
- Hydration errors
- Error overlay di Next.js
- Errori asincroni post-render
- Errori in componenti lazy/suspense

### P2 — L'agente verifica solo la pagina che ha modificato
Nessuna verifica multi-pagina. Un cambio CSS in `globals.css` o un refactor di un componente condiviso (es. Button, Card) puo' rompere altre 16 pagine.

### P3 — Nessun auditor indipendente
L'agente che implementa e' lo stesso che valuta l'accettazione. In fork context condivide il prompt — stesso bias, stesso modello.

### P4 — pastor verifica solo in PLAN, mai in BUILD
In BUILD, pastor non viene chiamato. La verifica architetturale e runtime e' assente nel ciclo di implementazione.

### P5 — E2E test non fanno parte del workflow agente
Le E2E spec (`all-routes.spec.ts`, `turbopack-health.spec.ts`) esistono ma non vengono invocate dopo i cambiamenti. Il `verify-all.mjs` esegue lint -> vitest -> build, ma non Playwright E2E.

### P6 — web_screenshot non rileva overlay Next.js
L'overlay di errore di Next.js (compilation error, 2 Issues, ecc.) non viene rilevato dallo screenshot perché:
- L'overlay e' un elemento DOM che lo screenshot cattura, ma l'agente non lo ispeziona
- L'overlay potrebbe nascondersi in headless mode
- Il tool `web_screenshot` non esegue `page.evaluate()` per rilevarlo

### P7 — Turbopack cache corruption non rilevata in BUILD
Il `globalSetup.ts` rileva la corruzione, ma solo quando si esegue `npx playwright test`. In BUILD mode:
- Gli agenti modificano codice
- Turbopack si corrompe
- L'agente fa `web_screenshot` -> vede errore ma non sa interpretarlo
- Oppure: lo screenshot non cattura l'errore -> agente dichiara successo

### P8 — Nessuna verifica async errors
Errori che appaiono dopo interazione (click, nav, timeout, polling) non vengono rilevati. Lo screenshot e' statico.

### P9 — Nessuna integrazione MCP
- `next-devtools-mcp` darebbe `get_errors` in tempo reale
- `@playwright/mcp` darebbe browser interattivo con console/network capture
- `chrome-devtools-mcp` darebbe debug devtools completo
- Nessuno configurato

### P10 — Il flusso di accettazione e' auto-certificato
L'`AcceptanceReport` richiede `commandsRun`, ma l'agente puo' dichiarare `passed` senza aver realmente eseguito il comando, o averlo eseguito in modo incompleto.

---

## Cause Probabili

1. **Design del workflow:** Il sistema e' progettato per implementazione rapida, non per verifica affidabile. La verifica e' secondaria.
2. **Tooling insufficiente:** `web_screenshot` e' pensato per preview visiva, non per debug runtime. Mancano tool per console, network, hydration.
3. **Nessun MCP server:** L'assenza di `next-devtools-mcp` taglia fuori l'unica fonte di errori runtime reali.
4. **Nessun ciclo di review indipendente:** pastor/davinci/human condividono lo stesso contesto. Nessun fresh-context auditor.
5. **Turbopack fragile:** La corruzione della cache e' un problema noto di Next.js 16 che amplifica i falsi positivi.
6. **Token budget:** Eseguire E2E test completi costa token e tempo. L'agente li salta per efficienza.

---

## Soluzioni Possibili

### Soluzione A — Skill di Verifica Runtime (Bassa complessita')

Creare una Skill `runtime-verify` che:
- Aggiunge tool `runtime_check` che esegue `pw-full.mjs` su URL specificato
- Cattura console errors, network failures, overlay Next.js
- Restituisce report strutturato: `{ page, consoleErrors[], networkFailures[], hasOverlay: bool }`
- Si integra con `acceptance-report` commandsRun

**Prompt skill:**
```
Quando implementi una modifica, esegui runtime_check su:
1. La pagina modificata
2. La homepage (/)
3. Almeno 2 pagine correlate (es. /login se tocchi auth)
Verifica che console.errors sia vuoto, networkFailures sia vuoto, hasOverlay sia false.
```

| Dimensione | Valore |
|-----------|--------|
| Vantaggi | Semplicissimo da implementare, riusa codice esistente (pw-full.mjs), costo quasi zero |
| Svantaggi | Non risolve il problema dell'auditor indipendente, no MCP, no real-time errors |
| Complessita' | 2/10 — Skill ~50 righe + riferimento a script esistente |
| Manutenzione | Bassa — script Playwright stabile |
| Affidabilita' | Media — cattura errori runtime ma non hydration mismatch complessi |
| Costo | ~2000 token per skill load, ~0$ runtime (locale) |

### Soluzione B — MCP Runtime Gateway (Media complessita')

Configurare `next-devtools-mcp` + `@playwright/mcp` come MCP servers:

**Cosa fa:**
- Agente chiama `nextjs_call("get_errors")` dopo ogni build -> riceve errori reali
- Agente chiama `browser_console_messages()` dopo navigazione -> cattura errori JS
- Agente chiama `browser_network_requests()` -> cattura fetch falliti
- Integrato nel workflow BUILD: implementa -> build -> get_errors -> browser_console -> screenshot -> report

**Config:**
```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless"]
    }
  }
}
```

| Dimensione | Valore |
|-----------|--------|
| Vantaggi | Accesso a errori reali di Next.js, console, network. Usa standard MCP, no custom code. Dato autorevole. |
| Svantaggi | Richiede configurazione MCP, dipendenza da MCP server esterni, ~300KB tool schemas in contesto |
| Complessita' | 4/10 — Aggiungere 2 righe in .mcp.json, abituare agenti a usare i tool |
| Manutenzione | Media — MCP servers mantenuti da Vercel+Microsoft |
| Affidabilita' | Alta — errori direttamente dal runtime Next.js, non da screenshot interpretati |
| Costo | Token aggiuntivi per tool schemas (~15K per MCP server), ~0$ runtime |

### Soluzione C — Ciclo di Verifica con Auditor Indipendente (Alta complessita')

Aggiungere un nuovo subagente `tester` con:
- **Context:** fresh (indipendente, senza bias del contesto BUILD)
- **Tools:** Accesso a Playwright + `next-devtools-mcp`
- **Ruolo:** Esegue le E2E spec dopo ogni fase BUILD
- **Flusso:** God: implementa (davinci/human) -> tester: verifica (fresh context) -> OK/REJECT

**Prompt tester:**
```
Mode: BUILD — Verifica runtime
Hai context fresco (non hai visto l'implementazione).

1. Esegui `npx playwright test --project=chromium`
2. Se test falliscono: reporta errore specifico (file:linea)
3. Se test passano: conferma che console errors = 0 su tutte le pagine
4. Verifica overlay Next.js su /login, /, /tasks
5. Cattura screenshot di 3 pagine critiche
6. Report finale: PASS/FAIL con evidenze
```

**Integrazione AGENTS.md:**
```
| tester | Verifica runtime indipendente | Fresh context, esegue E2E, cattura errori |
```

| Dimensione | Valore |
|-----------|--------|
| Vantaggi | Massima affidabilita'. Tester indipendente senza bias. E2E test reali. |
| Svantaggi | Costo token elevato (fresh context + E2E). 2-3 minuti per ciclo. |
| Complessita' | 6/10 — Definire agente, prompt, integrazione nel flusso BUILD |
| Manutenzione | Media-Alta — E2E test vanno mantenuti come i test normali |
| Affidabilita' | Molto Alta — test reali, non auto-certificazione |
| Costo | ~50K-100K token per ciclo tester (fresh context + tool calls) |

---

## Confronto Dettagliato

| Criterio | A: Skill | B: MCP | C: Tester |
|----------|----------|--------|-----------|
| Rileva console errors | ✅ | ✅ | ✅ |
| Rileva network failures | ✅ | ✅ | ✅ |
| Rileva hydration errors | ❌ | ✅ | ✅ |
| Rileva overlay Next.js | ✅ | ✅ | ✅ |
| Rileva async errors | ❌ | ✅ (browser_console listener) | ✅ |
| Rileva errori build | ❌ | ✅ (get_errors) | ✅ |
| Verifica multi-pagina | Manuale | Manuale | Automatico (E2E) |
| Auditor indipendente | ❌ | ❌ | ✅ |
| Token aggiuntivi | ~2K | ~15K per tool schemas | ~50K-100K per ciclo |
| Tempo per ciclo | ~5s | ~10s | ~2-3min |
| Manutenzione | Bassa | Media | Media-Alta |
| Setup | 1 skill file | 1 .mcp.json | 1 agente .md + prompt |
| Blocca falsi positivi | Parzialmente | Parzialmente | Quasi totalmente |
| Compatibilita' esistente | Riusa pw-full.mjs | Nuovo tool MCP | Riusa E2E esistenti |

---

## Raccomandazione Finale

**Approccio a 3 fasi, eseguite in ordine:**

### Fase 1: Skill runtime-verify (Ora — 1h)
La skill risolve il 70% dei falsi positivi con costo quasi zero. Obbliga gli agenti a:
1. Verificare console errors dopo ogni modifica
2. Verificare network errors
3. Verificare overlay Next.js
4. Verificare almeno 3 pagine

### Fase 2: MCP Gateway (Domani — 30min)
Aggiungere `next-devtools-mcp` per accesso a errori reali di build/runtime.
Aggiungere `@playwright/mcp` per browser automation interattiva con console capture.
Configurare `.mcp.json` alla radice del progetto.

### Fase 3: Tester subagent (Prossima settimana — 2h)
Aggiungere agente `tester` come auditor indipendente per fasi critiche:
- Refactor di componenti condivisi
- Cambiamenti globals.css/tokens
- Qualsiasi modifica che tocchi 5+ file

---

## Piano di Implementazione

### Task f1: Skill runtime-verify

Crea skill in `.agents/skills/runtime-verify/SKILL.md` che:
- Espone tool `runtime_check` (wrapper su Playwright)
- Definisce comportamento obbligatorio: verificare console + network + overlay + 3 pagine
- Si auto-attiva in BUILD mode

**Prompt:**
```
## Runtime Verification Protocol
Dopo ogni implementazione in BUILD mode, DEVI:
1. Eseguire runtime_check sulla pagina modificata
2. Eseguire runtime_check su homepage (/)
3. Eseguire runtime_check su 2 pagine correlate
4. Verificare: console errors = 0, network failures = 0, overlay Next.js = false
5. Includere risultati in acceptance-report.commandsRun
```

### Task f2: MCP servers

Aggiungere `next-devtools-mcp` e `@playwright/mcp` in `.mcp.json`.

### Task f3: Tester subagent

Creare `.agents/tester.md`:
```yaml
---
name: tester
description: Runtime verification agent. Fresh context, executes E2E tests, captures errors.
tools: read, bash, web_screenshot
defaultContext: fresh
---
```

Add to AGENTS.md:
```
| tester | Verifica runtime indipendente | Fresh context, Esegue E2E, report PASS/FAIL |
```

### Task f4: Aggiornare accettazione

Modificare lo schema `acceptance-report` in tutti gli agent BUILD per includere:
```json
"runtimeVerification": {
  "consoleErrors": [],
  "networkFailures": [],
  "hasOverlay": false,
  "pagesChecked": ["/modified", "/", "/login"]
}
```

---

## Rischi Residui

1. **Turbopack cache corruption** — Non risolvibile dal lato agente. Mitigazione: pre-flight check obbligatorio.
2. **Hydration mismatch** — Difficile da catturare anche con MCP. Richiede React DevTools o `browser_eval` specifico.
3. **Sentry errors** — Errori lato produzione non rilevabili in dev. Fuori scope.
4. **Race conditions** — Errori che appaiono solo con timing specifico (polling, realtime). Richiedono test specifici.
5. **Token cost del tester** — Fase 3 costa token. Va attivato solo per fasi critiche, non per ogni task.

---

## Appendice: Pastor Review — Correzioni e Raccomandazioni Finali

**Voto pastor: 6/10** — Diagnosi solida, prescrizione fragile.

### Cosa pastor approva
- P1, P3, P5, P7 confermati come cause primarie
- Metriche di successo (60% -> 5%) realistiche
- Fase 3 (tester subagent) — l'unica soluzione strutturale

### Cosa pastor corregge

**1. Fase 2 MCP sopravvalutata.**
- Playwright MCP consuma 114K token per sessione vs CLI 27K (4x meno)
- Il team Playwright raccomanda CLI per coding agent: *"If your tasks involve coding, testing, and you're using a coding agent - use CLI."*
- Pi NON supporta MCP nativamente — serve `pi-mcp-adapter` + configurazione + agenti addestrati

**2. browser-goblin non menzionato.**
- Pacchetto Pi esistente che fa esattamente cio' che la Fase 1 propone di costruire
- Tools: `browser_console`, `browser_errors`, `browser_network`, `browser_vitals`, `browser_qa`
- Skills: `browser-testing`, `browser-debugging`, `browser-visual-qa`
- Install: `pi install npm:browser-goblin` in 5 minuti

**3. Ordine rivisto delle fasi:**
| Fase | Report originale | Pastor raccomanda | Perche' |
|------|-----------------|-------------------|---------|
| 1 | Skill runtime-verify custom | `pi install npm:browser-goblin` | Gia' esistente, completo, zero codice |
| 2 | next-devtools-mcp + playwright-mcp | Playwright CLI + browser-goblin | 4x meno token, no adapter, raccomandato Playwright |
| 3 | Tester subagent | Tester subagent ✅ | Invariato, giusto |

### Problemi aggiuntivi
**P11 — Turbopack non verificato in BUILD:** Dopo ogni `npm run build` o cambio `next.config.ts`, eseguire `test-turbopack-check.sh`.
**P12 — web_screenshot va deprecato per debug:** Usare `browser_qa` o Playwright CLI per verifica runtime.

### Conclusione pastor
*"La Fase 2 MCP ha senso solo se vuoi get_errors come fonte autorevole e accetti il costo dell'adapter. Per r6hub, che ha gia' script Playwright funzionanti, il valore incrementale del MCP e' basso rispetto al costo. Procedere con: browser-goblin -> Playwright CLI -> tester."*

---

## Metriche di Successo

| Metrica | Ora | Target Fase 1 | Target Fase 3 |
|---------|-----|---------------|---------------|
| Falsi positivi dichiarati dall'agente | ~60% | ~20% | ~5% |
| Console errors catturati | 0% | 90% | 99% |
| Overlay catturati | ~10% (web_screenshot casuale) | 90% | 100% |
| Multi-pagina verificata | Mai | Sempre (3 pagine) | E2E completo |
| Errori turbopack pre-test | ~30% | ~70% | ~95% |
