-- Add map_id to lobbies for single map selection per lobby
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS map_id UUID REFERENCES maps(id) ON DELETE SET NULL;

-- Create index for map lookups
CREATE INDEX IF NOT EXISTS idx_lobbies_map_id ON lobbies (map_id);
