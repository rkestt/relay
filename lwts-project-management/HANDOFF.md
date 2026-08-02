# LWTS Project Management Integration

## Goal
Popolare la board LWTS "Relay" con tutti i task di sviluppo Relay, creare script di sync, testare tutto.

## Stato Attuale
- LWTS running su localhost:8080 (Docker Compose + PostgreSQL)
- Board "Relay" (key: RLY) vuota, creata per Andrea Fiori
- API key salvata nel wiki (entity lwts)
- Task sparsi in: PRODUCTION_LAUNCH_PLAN.md (~100+ task), .taskman/plans/*/tasks.jsonl, UI_REFACTOR_PLAN.md

## Cosa Fare
1. Popolare board "Relay" con:
   - Task da PRODUCTION_LAUNCH_PLAN.md (8 fasi, ~100 task)
   - Task da UI_REFACTOR_PLAN.md (6 fasi, ~20 task)
   - Task da .taskman/plans/ (piani attivi: a11y-md3, components-md3, etc.)
2. Creare scripts/lwts-sync.ts — sync bidirezionale tra .taskman/plans/ e LWTS
3. Testare con Playwright che LWTS sia raggiungibile e board popolata
4. Documentare nel wiki

## API Reference
Base: http://localhost:8080/api
Auth: `Authorization: Bearer lwts_sk_7c3ea50e36dce24d7c5d2cfd6693cd1e1dda168c72f978ddcefadeae6e70a4cd`

Endpoints usati:
- GET /api/v1/boards — lista board
- POST /api/v1/boards — create board (se necessario)
- GET /api/v1/boards/{id}/cards — lista cards
- POST /api/v1/boards/{id}/cards — create card
- DELETE /api/v1/cards/{id} — delete card

## Board Structure
Colonne: backlog, todo, in-progress, review, done, blocked, urgent
Labels per card: fase-1..fase-8, priority-critical/high/medium/low, type-bug/feature/chore

## Files
- scripts/lwts-sync.ts — sync script
- .taskman/plans/lwts-project-management/ — plan ledger
- wiki entities/lwts — documentazione

## Verification
- `curl http://localhost:8080/api/v1/boards/.../cards -H "Authorization: Bearer <key>"` → lista cards non vuota
- `npx playwright test e2e/lwts.spec.ts` → pass
