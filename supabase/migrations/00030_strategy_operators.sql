-- ============================================================
-- 00029_strategy_operators.sql
-- LWTS-11: strategie multi-operatore.
-- strategy_templates.operator_id resta il MAIN operator (invariato).
-- Questa junction contiene solo gli operatori AUSILIARI (0..N).
-- Additive: nessuna modifica a tabelle/colonne esistenti.
-- ============================================================

CREATE TABLE IF NOT EXISTS strategy_operators (
    strategy_id  UUID REFERENCES strategy_templates(id) ON DELETE CASCADE,
    operator_id  UUID REFERENCES operators(id)           ON DELETE CASCADE,
    PRIMARY KEY (strategy_id, operator_id)
);

-- Lookup inverso: "strategie per operatore X" (search/assign-tasks)
CREATE INDEX IF NOT EXISTS idx_strategy_operators_operator_id
    ON strategy_operators (operator_id);

-- RLS: mirror di strategy_tags (migrazione 00003)
ALTER TABLE strategy_operators ENABLE ROW LEVEL SECURITY;

-- Anyone can read aux operators for approved strategies
CREATE POLICY "strategy_operators_select_approved"
    ON strategy_operators FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.status = 'approved'
        )
    );

-- Authenticated users can link aux operators for their own strategies
CREATE POLICY "strategy_operators_insert_own"
    ON strategy_operators FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );
