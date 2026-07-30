-- Add operator_id to strategy_templates for per-operator strategies
ALTER TABLE strategy_templates ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id) ON DELETE SET NULL;

-- Create index for operator lookups
CREATE INDEX IF NOT EXISTS idx_strategy_templates_operator_id ON strategy_templates (operator_id);
