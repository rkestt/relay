# Pagine Home + Lobby MD3 — Phase 4

## Obiettivo
Refactor homepage e lobby con MD3.

## Decisioni Tecniche
- **Home**: CTA hierarchy (1 filled + 1 outlined + 1 text). Join flow in Dialog.
- **Lobby**: split in 6 subcomponenti (LobbyHeader, LobbyMembers, LobbyScore, LobbyControls, LobbyStatus, RoundWinnerModal). Page = orchestrator.
- **Member cards**: responsive 1/2/3 col.
- **Modals**: bottom sheet su mobile.

## Rollback
Commit separato. `git revert <commit-hash>`.

## Agent
- davinci → UI | human → codice | pastor → component structure