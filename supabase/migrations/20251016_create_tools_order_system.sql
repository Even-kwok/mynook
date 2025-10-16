-- Create tools_order table for storing the global order of toolbar tools
CREATE TABLE IF NOT EXISTS tools_order (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  emoji TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_coming_soon BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_tools_order_sort ON tools_order(sort_order);

-- Insert default tools order
INSERT INTO tools_order (tool_id, name, short_name, emoji, is_premium, is_coming_soon, sort_order) VALUES
  ('interior', 'Interior Design', 'Interior', '🛋️', false, false, 1),
  ('exterior', 'Exterior Design', 'Exterior', '🏠', false, false, 2),
  ('wall', 'Wall Design', 'Wall', '🎨', false, false, 3),
  ('floor', 'Floor Style', 'Floor', '🟫', false, false, 4),
  ('garden', 'Garden & Backyard Design', 'Garden', '🌳', false, false, 5),
  ('festive', 'Festive Decor', 'Festive', '🎄', false, false, 6),
  ('item-replace', 'Item Replace', 'Replace', '➕', true, false, 7),
  ('style-match', 'Reference Style Match', E'Style\nMatch', '🖼️', true, false, 8),
  ('ai-advisor', 'AI Design Advisor', E'AI\nAdvisor', '💬', false, true, 9),
  ('multi-item', 'Multi-Item Preview', E'Multi\nItem', '📦', false, true, 10),
  ('free-canvas', 'Canva', 'Canva', '✏️', true, false, 11)
ON CONFLICT (tool_id) DO NOTHING;

-- Enable RLS
ALTER TABLE tools_order ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read tools order
CREATE POLICY "Anyone can view tools order" ON tools_order
  FOR SELECT USING (true);

-- Policy: Only admins can update tools order
CREATE POLICY "Only admins can update tools order" ON tools_order
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tools_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER tools_order_updated_at
  BEFORE UPDATE ON tools_order
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_order_updated_at();

