-- ============================================================
-- 00031_strategy_side.sql
-- LWTS-17: lato (attacker/defender) sulle strategie.
-- Flag scelto all'inizio del submit; gli operatori main/aux
-- devono appartenere alla stessa fazione (validato in app).
-- Additive: colonna nuova + backfill, nessuna modifica a dati esistenti.
-- ============================================================

ALTER TABLE strategy_templates
    ADD COLUMN IF NOT EXISTS side TEXT
    CHECK (side IN ('attacker','defender'));

-- Backfill: deriva il lato dal main operator (operators.side).
-- Le strategie senza operator_id restano NULL (pending, non assegnate).
UPDATE strategy_templates st
SET side = o.side
FROM operators o
WHERE o.id = st.operator_id
  AND st.side IS NULL;

CREATE INDEX IF NOT EXISTS idx_strategy_templates_side
    ON strategy_templates (side);
