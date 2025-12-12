-- Add visibility toggle for left toolbar tools
-- Allows admin to show/hide tools without deleting them

ALTER TABLE tools_order
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Safety: ensure existing rows are visible
UPDATE tools_order
SET is_visible = true
WHERE is_visible IS NULL;
