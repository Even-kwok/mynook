-- Hero Banner System Migration
-- 为 gallery_items 表添加轮播相关字段

-- 添加新字段到 gallery_items 表
ALTER TABLE gallery_items 
ADD COLUMN IF NOT EXISTS banner_title TEXT,
ADD COLUMN IF NOT EXISTS banner_subtitle TEXT,
ADD COLUMN IF NOT EXISTS transition_effect TEXT DEFAULT 'fade' CHECK (transition_effect IN ('fade', 'slide', 'zoom')),
ADD COLUMN IF NOT EXISTS display_duration INTEGER DEFAULT 5 CHECK (display_duration > 0 AND display_duration <= 30),
ADD COLUMN IF NOT EXISTS is_autoplay BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 创建索引以优化 Hero Banner 查询
CREATE INDEX IF NOT EXISTS idx_gallery_items_hero_banner 
ON gallery_items(category, is_active, sort_order) 
WHERE category = 'hero-banner';

-- 为现有的 hero-banner 记录设置默认值
UPDATE gallery_items 
SET 
  banner_title = COALESCE(banner_title, title),
  banner_subtitle = COALESCE(banner_subtitle, 'Transform photos of your rooms with powerful AI'),
  transition_effect = COALESCE(transition_effect, 'fade'),
  display_duration = COALESCE(display_duration, 5),
  is_autoplay = COALESCE(is_autoplay, true),
  sort_order = COALESCE(sort_order, display_order)
WHERE category = 'hero-banner';

-- 添加注释说明
COMMENT ON COLUMN gallery_items.banner_title IS '横幅主标题 (用于 hero-banner)';
COMMENT ON COLUMN gallery_items.banner_subtitle IS '横幅副标题 (用于 hero-banner)';
COMMENT ON COLUMN gallery_items.transition_effect IS '过渡效果类型: fade, slide, zoom';
COMMENT ON COLUMN gallery_items.display_duration IS '显示时长（秒），范围 1-30';
COMMENT ON COLUMN gallery_items.is_autoplay IS '是否自动播放轮播';
COMMENT ON COLUMN gallery_items.sort_order IS '排序顺序，数字越小越靠前';

