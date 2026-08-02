# LWTS Cards Backup — 29/07/2026

## R6H-1 — DB: miglioramenti senza toccare struttura tabelle
- **Board:** Relay
- **Colonna:** in-progress
- **Priorità:** medium
- **Tag:** blue
- **Descrizione:** Task aggregato dei miglioramenti DB che non richiedono cambi di schema.

7 sotto-task:
1. Popolare operator_tags per tutti i 75 operatori
2. Backfill operator_id sulle strategie esistenti
3. Fix GET /api/strategies — include operator_id nella select
4. Allineamento validazione Zod con schema DB
5. Standardizzare migrazioni con supabase db diff
6. Type generation da DB
7. Indice su validation_queue.expires_at

## R6H-2 — Full Hetzner Access for opencode
- **Board:** Relay
- **Colonna:** todo
- **Priorità:** medium
- **Tag:** blue
- **Scadenza:** 2026-08-04
- **Descrizione:** Cosi' almeno ha il pieno controllo sull'applicazione:
  - Skill custom auto-aggiornata
  - Funzionalita' completa sul vps
