# Debug Workflow

Due modalità: **Quick Loop** (manuale, debugging rapido) e **Deep Loop** (autonomo,
con plan + subagents, per sessioni complete).

---

## Quick Loop

Usa quando sai già cosa cercare. Senza plan, senza subagents.

```
1. npm run dev:log
2. npx playwright test e2e/health.spec.ts --reporter=list
3. cat turbopack.log
4. cat .next/dev/logs/next-development.log 2>/dev/null | grep ERROR
5. Se errori → match con references/patterns.md → fix → goto 2
6. OK → fine
```

## Deep Loop

Usa per sessioni autonome complete. Richiede God + subagents.

### Plan Template

Copia-incolla per God:

```bash
# Crea il plan
submit_plan({
  name: "turbopack-debug-<data>",
  title: "Turbopack Debug Session - <data>",
  handoff: "Debug loop per errori silenziosi di Turbopack. "
    + "Vedi .pi/skills/turbopack-debug/ per contesto completo.",
  tasks: [
    { id: "t-001", description: "Preflight: verifica dipendenze e kill server" },
    { id: "t-002", description: "messiah: esplora app/ per route pubbliche",
      depends_on: ["t-001"] },
    { id: "t-003", description: "human: aggiorna test Playwright per route trovate",
      depends_on: ["t-002"] },
    { id: "t-004", description: "bash: esegui dev:log + playwright test",
      depends_on: ["t-003"] },
    { id: "t-005", description: "Leggi errori da 3 canali e diagnostica",
      depends_on: ["t-004"] },
    { id: "t-006", description: "human: fix errori trovati",
      depends_on: ["t-005"] },
    { id: "t-007", description: "Verifica: riavvia dev:log + playwright test",
      depends_on: ["t-006"] },
    { id: "t-008", description: "evangelist: salva pattern nel wiki",
      depends_on: ["t-007"] },
    { id: "t-009", description: "Report finale",
      depends_on: ["t-008"] },
  ]
})
```

### Loop Decision Tree

```
t-001 [Preflight]
  │
  ▼
t-002 [messiah: esplora]
  │
  ▼
t-003 [human: scrivi test]
  │
  ▼
t-004 [bash: playwright + log]
  │
  ├── test passano → t-008 [evangelist: wiki] → t-009 [report] → DONE
  │
  └── test falliscono → t-005 [diagnostica]
                          │
                          ▼
                        t-006 [human: fix]
                          │
                          ▼
                        t-007 [verifica]
                          │
                          ├── OK → t-008
                          │
                          └── FALLISCE ANCORA → add_task nuovo fix → goto t-006
```

### Pattern di chiamata subagent

```javascript
// t-002: messiah esplora route
subagent({ chain: [
  { agent: "messiah",
    task: "Mode: BUILD - Esplora app/ e src/ directory. "
      + "Lista tutte le route pubbliche (pagine, API, proxy). "
      + "Ignora node_modules, .next, .git.",
    as: "routes",
    outputSchema: {
      type: "object",
      properties: {
        pages: { type: "array", items: { type: "string" } },
        api: { type: "array", items: { type: "string" } },
      }
    }
  }
]})

// t-003: human aggiorna test
subagent({ chain: [
  { agent: "human",
    task: "Mode: BUILD - Leggi routes da {outputs.routes}. "
      + "Scrivi test Playwright in e2e/probes/ per ogni pagina. "
      + "Usa template da references/probes.md."
  }
]})

// t-005: diagnostica errori
subagent({ chain: [
  { agent: "human",
    task: "Mode: BUILD - Leggi turbopack.log e test-results/. "
      + "Match errori con references/patterns.md. "
      + "Se pattern sconosciuto: riassumi errore per pastor."
  }
]})

// t-008: evangelist salva wiki
subagent({ chain: [
  { agent: "evangelist",
    task: "Mode: BUILD - Salva i pattern di errore trovati "
      + "e i fix applicati nel wiki. "
      + "Usa wiki_observe per ogni pattern."
  }
]})
```

### Errori durante il loop

| Situazione | Cosa fare |
|------------|-----------|
| test fallisce al primo run | Normale: è il bug da fixare. Vai a t-005. |
| test fallisce dopo fix | update_task t-007 blocked, add_task nuovo fix, riprova. |
| messiah non trova route | Possibile: app tutta SSR o errore 500 blocca tutto. Vai diretto a t-004. |
| playwright non si connette | Dev server non partito. Verifica con lsof -i :3000. |
| pattern sconosciuto | Chiedi a pastor: "Nuovo errore, help diagnosticare". |
| loop infinito (3+ fix falliti) | Fermati. update_plan blocked. Chiedi aiuto. |

## 3 Canali di Errore

| Canale | Contiene | Leggi con |
|--------|----------|-----------|
| `turbopack.log` | stdout/stderr del processo dev | `cat turbopack.log` |
| `.next/dev/logs/next-development.log` | JSON errors server + browser | `grep ERROR .next/dev/logs/next-development.log` |
| Playwright `test-results/` | Screenshot, trace, error-context | `ls test-results/` + `cat test-results/*/error-context.md` |
