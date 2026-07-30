---
name: turbopack-debug
description: >-
  Autonomous debug loop for Next.js Turbopack silent errors. Turbopack
  compilation errors (Rust PostCSS failures, missing modules, webpack plugin
  incompatibilities, deprecated conventions) only surface when a browser
  requests a page, not in the dev server terminal. This skill gives the AI
  agent eyes on those errors via Playwright probing + log redirection + a
  pattern-based fix loop. Use when next dev prints "Ready" but pages 500, CSS
  is missing, HMR freezes, or the agent can't see why the app is broken.
compatibility: Next.js 16+, @playwright/test in project
allowed-tools: Bash(playwright:*,npm:*), Bash(cat:*), Bash(ls:*), Bash(lsof:*), Bash(kill:*), Bash(grep:*), Bash(head:*), Bash(tail:*), Bash(find:*), Bash(rm:*), Bash(mv:*), Bash(rg:*)
---

# turbopack-debug

## Quando usarlo

- `npm run dev` dice `✓ Ready` ma le pagine danno 500
- Errori "Cannot find module" che appaiono solo nel browser
- Plugin PWA/Workbox che non funzionano con Turbopack
- Warning su `middleware` deprecato o `NODE_ENV` non standard
- HMR non parte o build loopa all'infinito
- L'agente non riesce a vedere errori di Next.js perché il terminale è pulito

## Quick Start

```bash
# 1. Preflight — tutto pronto?
npx playwright --version          # Playwright installato?
ls playwright.config.ts            # Config esiste?
ls ~/.cache/ms-playwright/         # Browser scaricato?

# 2. Avvia con log capture
npm run dev:log

# 3. Prova le pagine
npx playwright test e2e/health.spec.ts --reporter=list

# 4. Leggi errori da 3 canali
cat turbopack.log
cat .next/dev/logs/next-development.log 2>/dev/null | grep ERROR
ls test-results/                        # Screenshot degli errori
```

## Load Reference Modules

| File | Cosa contiene |
|------|---------------|
| [references/workflow.md](references/workflow.md) | Debug loop completo + plan template per God |
| [references/patterns.md](references/patterns.md) | Catalogo 8 pattern errore con fix |
| [references/probes.md](references/probes.md) | Template test Playwright per probing pagine |
| [references/preflight.md](references/preflight.md) | Checklist preflight dettagliata |

## Pattern Architecture

```
┌──────────────────────────────────────────────────────────┐
│  God (orchestrator)                                       │
│                                                          │
│  1. Legge SKILL.md → capisce il loop                     │
│  2. Carica references/workflow.md → ha il template plan   │
│  3. Crea submit_plan con task (references/plan-template)  │
│  4. Esegue ogni task, delegando a subagents               │
│     ├─ messiah → esplora route                           │
│     ├─ human → scrive/aggiorna test                      │
│     ├─ bash → playwright + log capture                   │
│     └─ evangelist → salva pattern nel wiki               │
│  5. Se errori → add_task fix → goto 4                    │
│  6. OK → plan_status done + wiki_retro                   │
└──────────────────────────────────────────────────────────┘
```

## Loops

### Quick Loop (manuale, per debugging rapido)
Vedi [references/workflow.md](references/workflow.md#quick-loop)

### Deep Loop (autonomo, con plan + subagents)
Vedi [references/workflow.md](references/workflow.md#deep-loop)

## Project Prerequisites

La skill assume che il progetto abbia:
- `@playwright/test` in devDependencies
- `playwright.config.ts` con baseURL
- Script `npm run dev:log` (next dev --turbo > turbopack.log 2>&1)
- Script `npm run test:e2e` (playwright test)
- `e2e/health.spec.ts` come test base
- `turbopack.log` in .gitignore
