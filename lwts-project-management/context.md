# Context: LWTS Project Management Integration

## Intent
Integrare LWTS (kanban board su localhost:8080) come strumento di project management per lo sviluppo di Relay. Popolare la board "Relay" con tutti i task dai piani esistenti, creare script di sync, testare tutto.

## Decisioni
- **Board unica "Relay Development"** con colonne: Backlog, Todo, In Progress, Review, Done, Blocked, Urgent
- **Sync bidirezionale**: script TypeScript che legge .taskman/plans/*/tasks.jsonl + PRODUCTION_LAUNCH_PLAN.md e crea/aggiorna cards su LWTS
- **Labels/Fasi**: ogni card ha label = fase (1-8) + priorità + tipo
- **Testing**: test con Playwright per verificare che LWTS risponda + cards create

## Constraints
- LWTS su localhost:8080 (Docker Compose, PostgreSQL)
- API key: salvata nel wiki
- .taskman/plans/ gia' strutturato con piani MD3

## Open Questions

## Approccio
1. Popolare board LWTS con task da PRODUCTION_LAUNCH_PLAN.md via API
2. Creare script scripts/lwts-sync.ts per sync automatico
3. Testare con Playwright che board e cards esistano
