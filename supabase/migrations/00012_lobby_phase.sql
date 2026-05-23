-- Add phase column to lobbies for waiting room flow
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'waiting' CHECK (phase IN ('waiting', 'playing', 'closed'));

-- Update existing active lobbies to 'playing' so they don't break
UPDATE lobbies SET phase = 'playing' WHERE status = 'active' AND phase = 'waiting';

-- Create index for phase lookups
CREATE INDEX IF NOT EXISTS idx_lobbies_phase ON lobbies (phase);
