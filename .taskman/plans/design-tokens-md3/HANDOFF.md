# Design Tokens + Theme Toggle — Phase 1

## Obiettivo
Fondazione MD3: nuovi tokens (palette, elevation, motion) + theme toggle dark/light/system + compatibility shim.

## Decisioni Tecniche
- **Palette**: OKLCH con MD3 color roles
  - `--primary` = keep red-orange fire (brand)
  - `--destructive` = move to error red (hue ~15-20, lower chroma) — FIX BUG
  - `--attacker` = keep brand red-orange (solo per badge/indicator)
  - `--secondary` = MD3 secondary container tone
  - Add `--surface`, `--surface-variant`, `--surface-container-*`, `--outline`, `--outline-variant`
- **Light theme**: `[data-theme="light"]` block in globals.css con inverted surfaces
- **Compatibility shim**: mantenere vecchi nomi variabili come alias dei nuovi per backward compat con 17 pagine esistenti:
  ```css
  --old-primary: var(--primary);
  --old-destructive: var(--destructive);
  /* etc. per qualsiasi nome rimosso */
  ```
- **Theme provider**: Zustand store `stores/themeStore.ts` (persist localStorage, key `r6hub_theme`)
- **Theme toggle**: `components/ui/ThemeToggle.tsx` (icon button: sun/moon/monitor)
- **Fonts**: Geist resta (no change)

## Files
- **Create**: `stores/themeStore.ts`, `components/ui/ThemeToggle.tsx`
- **Modify**: `globals.css`, `DESIGN.md`
- **NOT modifying**: `app/layout.tsx` — ThemeProvider integration spostata in fase 2 (layout-shell) per evitare merge conflicts

## Rollback
Commit separato: `git revert <commit-hash>` per tornare indietro.

## Agent
- **davinci**: UI design, theme toggle component, screenshots
- **human**: implementazione codice, CSS tokens, Zustand store
- **pastor**: architettura, state management review

## Verifica
- [ ] `--destructive` ≠ `--primary` visivamente
- [ ] Light theme funzionante (toggle dark ↔ light ↔ system)
- [ ] Persistenza localStorage
- [ ] System preference detection
- [ ] Compatibility shim: vecchie pagine funzionano con nuovi token
- [ ] Build passa
- [ ] Screenshot dark + light mode