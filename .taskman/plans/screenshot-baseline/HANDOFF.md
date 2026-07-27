# Screenshot Baseline — Phase 0

## Contesto
Pastor: "Nessuna baseline visiva pre-refactor — come dimostri miglioramento?"
Davinci: "Phase 0: screenshot every page at 375px + 1440px. Save to docs/ui-baseline/ so we can prove improvement."

## Obiettivo
Screenshot baseline di tutte le pagine principali PRIMA del refactor, per confronto post-refactor.

## Scope
Screenshot di:
- Homepage (`/`)
- Lobby (tutti gli stati: waiting, playing, map-selection, match-complete)
- Submit page (`/submit`)
- Settings pages (account, cookies)
- Tasks pages (list, detail)

## Risoluzioni
- Mobile: 375px (iPhone SE viewport)
- Desktop: 1440px (standard desktop viewport)

## Output
- Cartella `docs/ui-baseline/` con tutti gli screenshot PNG
- Naming convention: `page-state-viewport.png` (es: `homepage-dark-desktop.png`, `lobby-waiting-dark-mobile.png`)
- Index file `docs/ui-baseline/README.md` con lista di tutti gli screenshot

## Agent
- **davinci**: screenshot con web_screenshot tool
- **evangelist**: cattura baseline nel wiki

## Verifica
- [ ] Tutti gli screenshot salvati in `docs/ui-baseline/`
- [ ] README.md con lista completa
- [ ] Screenshot dark mode (current state)
- [ ] Screenshot mobile (375px) + desktop (1440px)
- [ ] Wiki page "UI Baseline Pre-Refactor" creata