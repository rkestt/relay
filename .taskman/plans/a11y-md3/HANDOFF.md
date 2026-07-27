# Accessibility Audit MD3 — Phase 6 (SOLO VERIFICA)

## Obiettivo
Audit finale WCAG AA. Solo verifica, no implementazione.

## Scope
Verifica fix a11y implementati nelle fasi 1-5.

## Tool
- @axe-core/playwright per e2e tests
- Lighthouse CI per score ≥ 95
- VoiceOver/NVDA manual test
- Keyboard navigation test

## Rollback
Commit separato per test suite. `git revert <commit-hash>`.

## Agent
- davinci → contrast check | human → e2e tests | pastor → a11y review