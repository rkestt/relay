ALTER TABLE rounds ADD COLUMN IF NOT EXISTS winner_side TEXT CHECK (winner_side IN ('attacker', 'defender'));
