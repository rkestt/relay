# Pagine Secondarie MD3 — Phase 5

## Obiettivo
Refactor submit, settings, tasks con MD3.

## Decisioni Tecniche
- **Submit**: split in 4 subcomponenti (StrategyForm, ImageUpload, HotspotEditor, MapSiteSelector). MD3 form patterns.
- **Settings**: MD3 list with switches, feedback visivo.
- **Tasks**: Card MD3 elevated + Button MD3 tonal. MapViewer responsive.

## Rollback
Commit separato. `git revert <commit-hash>`.

## Agent
- davinci → UI | human → codice | pastor → component structure