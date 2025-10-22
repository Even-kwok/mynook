-- Add Image Upscale tool to tools_order table
-- Created: 2025-10-22
-- Description: 添加图片放大功能到工具栏

INSERT INTO tools_order (tool_id, name, short_name, emoji, is_premium, is_coming_soon, sort_order) 
VALUES ('image-upscale', 'Image Upscale', 'Upscale', '🔍', true, false, 12)
ON CONFLICT (tool_id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  emoji = EXCLUDED.emoji,
  is_premium = EXCLUDED.is_premium,
  is_coming_soon = EXCLUDED.is_coming_soon,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

