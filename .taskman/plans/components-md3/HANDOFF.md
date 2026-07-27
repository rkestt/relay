# Componenti Base MD3 — Phase 3

## Obiettivo
Refactor componenti base con stile MD3.

## Decisioni Tecniche
- **Button**: keep @base-ui/react/button. Nuove varianti MD3: filled, filled-tonal, outlined, text, elevated. State layers. Rimuovere hover:scale gimmick.
- **Dialog**: switch to @base-ui/react/dialog per focus trap + aria-modal + role="dialog". Mantenere mobile bottom-sheet.
- **Input**: InputField wrapper con Label, HelperText, ErrorText + aria-describedby.
- **Card**: variant prop (elevated, filled, outlined). State layers per interactive.
- **Badge**: MD3 chip style.

## Rollback
Commit separato. `git revert <commit-hash>`.

## Agent
- davinci → UI design | human → codice | pastor → architettura Dialog choice