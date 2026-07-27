# UI Refactor — Material Design 3

**Branch:** `refactor/ui-material-design`  
**Stato:** 🟡 Pianificato, pronto per esecuzione  
**Voto pastor:** 7/10 (safety gap, non design gap)

---

## Quick Start

```bash
git checkout refactor/ui-material-design
npm run dev
```

---

## Piano Esecuzione (7 fasi sequenziali)

| # | Piano | Tasks | Stato | File |
|---|-------|-------|-------|------|
| 0 | [Screenshot Baseline](.taskman/plans/screenshot-baseline/HANDOFF.md) | 3 | 🟡 Pronto | [tasks](.taskman/plans/screenshot-baseline/tasks.jsonl) |
| 1 | [Design Tokens + Theme](.taskman/plans/design-tokens-md3/HANDOFF.md) | 5 | ⏸️ Blocked | [tasks](.taskman/plans/design-tokens-md3/tasks.jsonl) |
| 2 | [Layout Shell](.taskman/plans/layout-shell-md3/HANDOFF.md) | 5 | ⏸️ Blocked | [tasks](.taskman/plans/layout-shell-md3/tasks.jsonl) |
| 3 | [Components MD3](.taskman/plans/components-md3/HANDOFF.md) | 6 | ⏸️ Blocked | [tasks](.taskman/plans/components-md3/tasks.jsonl) |
| 4 | [Pages Home+Lobby](.taskman/plans/pages-home-lobby-md3/HANDOFF.md) | 5 | ⏸️ Blocked | [tasks](.taskman/plans/pages-home-lobby-md3/tasks.jsonl) |
| 5 | [Pages Subpages](.taskman/plans/pages-subpages-md3/HANDOFF.md) | 5 | ⏸️ Blocked | [tasks](.taskman/plans/pages-subpages-md3/tasks.jsonl) |
| 6 | [A11y Audit](.taskman/plans/a11y-md3/HANDOFF.md) | 4 | ⏸️ Blocked | [tasks](.taskman/plans/a11y-md3/tasks.jsonl) |

**Totale:** 33 tasks

---

## Catena Dipendenze

```
0. screenshot-baseline [READY]
   ↓
1. design-tokens-md3 [+ theme-toggle + compat shim]
   ↓
2. layout-shell-md3 [+ ThemeProvider integration]
   ↓
3. components-md3
   ↓
4. pages-home-lobby-md3
   ↓
5. pages-subpages-md3
   ↓
6. a11y-md3
```

---

## Workflow Subagent

| Agente | Ruolo | Skill |
|--------|-------|-------|
| **davinci** | UI design, visual review | impeccable, hallmark |
| **human** | Implementazione codice | — |
| **pastor** | Architettura, decisioni tecniche | grill-me |
| **messiah** | Codebase mapping | — |
| **evangelist** | Wiki capture | — |

---

## Decisioni Chiave

### Stack
- Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + @base-ui/react
- **NO MUI** — applichiamo principi MD3 su stack esistente

### Palette
- `--primary` = red-orange fire (brand)
- `--destructive` = error red (FIX: ≠ primary)
- `--attacker` = brand red-orange (solo indicator)
- OKLCH color space

### Theme
- Zustand store `stores/themeStore.ts`
- Persistenza localStorage
- System preference detection
- Dark + light + system modes

### Font
- Geist Sans + Geist Mono (no change)

---

## Pastor Conditions (integrate ✅)

1. **Compatibility shim** — alias vecchi token CSS per backward compat (task dt-001)
2. **layout.tsx single-touch** — ThemeProvider integration in fase 2, non fase 1 (task ls-001)
3. **Rollback strategy** — ogni fase = commit separato, `git revert <hash>` (in tutti i piani)

---

## Critiche Pastor Originali (integrate ✅)

- ✅ Theme-toggle fuso in fase 1
- ✅ A11y cross-cutting + audit finale solo verifica
- ✅ Layout-shell prima dei componenti
- ✅ `--destructive` ≠ `--primary` fix in fase 1
- ✅ Baseline screenshot fase 0

---

## Gap per 8-9/10 (da fare durante esecuzione)

- Test coverage pre-refactor
- Performance benchmark (bundle size, LCP, CLS)
- Compatibility shim testato su 17 pagine
- Performance budget (LCP < 2.5s, CLS < 0.1)

**Pastor dice:** "Non integrare prima. Esegui. Migliora durante esecuzione."

---

## Problemi Attuali UI (da davinci + messiah)

### 🔴 Bloccanti
1. `--primary === --destructive` (stesso colore)
2. Dialog custom senza focus trap, aria-modal, role
3. UserMenu nascosto in lobby
4. WIP overlay invasivo z-9999
5. No navigazione persistente
6. Dark-only

### 🟡 Significativi
7. Lobby page monolitica ~700 righe
8. Submit page monolitica ~500 righe
9. Radius inconsistente
10. Viewport zoom disabilitato

---

## Skill Installate

- ✅ impeccable (206K installs) — critique, audit, polish, animate
- ✅ hallmark (27K installs) — anti-slop, themes, macrostructures
- ✅ grill-me (662K installs) — plan review

---

## Documentazione

- [DESIGN.md](DESIGN.md) — design system attuale (da aggiornare in fase 1)
- [PRODUCT.md](PRODUCT.md) — product context
- [Wiki wiki](../../.llm-wiki/wiki/) — decisioni catturate

---

## Prossimo Step

**Fase 0: Screenshot Baseline**

Davinci cattura screenshot di tutte le pagine in dark mode (mobile + desktop) per baseline pre-refactor.

Output: `docs/ui-baseline/` con tutti gli screenshot + README.md

---

## Rollback

Ogni fase = commit separato. Per tornare indietro:
```bash
git log --oneline
git revert <commit-hash>
```

---

## Note

- Branch creato: ✅
- Piano approvato da pastor: ✅ (7/10)
- 3 condizioni pastor integrate: ✅
- Dipendenze corrette: ✅
- Pronto per esecuzione: ✅
