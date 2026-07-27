-- ============================================================
-- 00003_lobby_starting_side.sql — Add starting_side to lobbies
-- and team_side to rounds for R6S side-swap logic
-- ============================================================

-- Add starting_side to lobbies (the leader's team side in round 1)
ALTER TABLE lobbies
ADD COLUMN IF NOT EXISTS starting_side TEXT CHECK (starting_side IN ('attacker', 'defender'));

-- Add team_side to rounds (computed: leader's team side for this round)
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS team_side TEXT CHECK (team_side IN ('attacker', 'defender'));

-- Add opponent_side helper as generated column
-- In R6S, if team is attacker, opponent is defender and vice versa
-- We compute this client-side, but storing team_side is enough
