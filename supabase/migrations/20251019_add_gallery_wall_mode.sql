-- Add Gallery Wall Mode to Home Sections
-- 为 Home Sections 添加图片墙显示模式

-- 添加显示模式和图片墙配置字段
ALTER TABLE home_sections 
  ADD COLUMN display_mode TEXT DEFAULT 'media_showcase' 
    CHECK (display_mode IN ('media_showcase', 'gallery_wall')),
  ADD COLUMN gallery_filter_type TEXT 
    CHECK (gallery_filter_type IN ('main_category', 'sub_category', 'main_random', 'all_random')),
  ADD COLUMN gallery_main_category TEXT,
  ADD COLUMN gallery_sub_category TEXT;

-- 添加字段说明
COMMENT ON COLUMN home_sections.display_mode IS 
  'Display mode: media_showcase (default) or gallery_wall';
COMMENT ON COLUMN home_sections.gallery_filter_type IS 
  'Gallery filter type: main_category, sub_category, main_random, all_random';
COMMENT ON COLUMN home_sections.gallery_main_category IS 
  'Main category for gallery filtering';
COMMENT ON COLUMN home_sections.gallery_sub_category IS 
  'Sub category for gallery filtering';

