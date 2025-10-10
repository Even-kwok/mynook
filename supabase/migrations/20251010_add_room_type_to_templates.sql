-- ============================================
-- 添加房间类型支持
-- ============================================
-- 创建时间: 2025-10-10
-- 描述: 为design_templates表添加room_type字段，支持按房间类型筛选模板
-- ============================================

-- ============================================
-- 第 1 部分: 添加 room_type 字段
-- ============================================

ALTER TABLE public.design_templates 
ADD COLUMN IF NOT EXISTS room_type TEXT;

COMMENT ON COLUMN public.design_templates.room_type IS '房间类型：living-room, bedroom, kitchen等，用于Interior Design分类';

-- ============================================
-- 第 2 部分: 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_templates_room_type ON public.design_templates(room_type);

-- ============================================
-- 第 3 部分: 更新现有数据
-- ============================================

-- 为Interior Design的模板设置room_type
-- Living Room 模板
UPDATE public.design_templates 
SET room_type = 'living-room'
WHERE main_category = 'Interior Design'
AND name IN (
  'Modern Minimalist',
  'Scandinavian',
  'Bohemian',
  'Industrial Loft',
  'Coastal',
  'Japandi',
  'Art Deco',
  'Mid-Century Modern',
  'Tropical'
);

-- Bedroom 模板
UPDATE public.design_templates 
SET room_type = 'bedroom'
WHERE main_category = 'Interior Design'
AND name IN (
  'Scandinavian',
  'Bohemian',
  'Coastal',
  'Japandi',
  'Modern Minimalist',
  'Tropical'
)
AND room_type IS NULL; -- 避免重复更新已经设置为living-room的

-- Bathroom 模板
UPDATE public.design_templates 
SET room_type = 'bathroom'
WHERE main_category = 'Interior Design'
AND name IN (
  'Spa-like',
  'Modern Minimalist',
  'Coastal',
  'Japandi'
)
AND room_type IS NULL;

-- Kitchen 模板
UPDATE public.design_templates 
SET room_type = 'kitchen'
WHERE main_category = 'Interior Design'
AND name IN (
  'Farmhouse',
  'Modern Minimalist',
  'Scandinavian',
  'Industrial Loft',
  'Mid-Century Modern'
)
AND room_type IS NULL;

-- Dining Room 模板
UPDATE public.design_templates 
SET room_type = 'dining-room'
WHERE main_category = 'Interior Design'
AND name IN (
  'Mid-Century Modern',
  'Art Deco',
  'Farmhouse',
  'Scandinavian',
  'Industrial Loft'
)
AND room_type IS NULL;

-- Home Office 模板
UPDATE public.design_templates 
SET room_type = 'home-office'
WHERE main_category = 'Interior Design'
AND name IN (
  'Professional',
  'Modern Minimalist',
  'Industrial Loft',
  'Mid-Century Modern'
)
AND room_type IS NULL;

-- ============================================
-- 第 4 部分: 创建辅助函数
-- ============================================

-- 获取特定房间类型的模板
CREATE OR REPLACE FUNCTION public.get_templates_by_room_type(
  p_room_type TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  image_url TEXT,
  prompt TEXT,
  main_category TEXT,
  sub_category TEXT,
  room_type TEXT,
  enabled BOOLEAN,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.id,
    dt.name,
    dt.image_url,
    dt.prompt,
    dt.main_category,
    dt.sub_category,
    dt.room_type,
    dt.enabled,
    dt.sort_order
  FROM public.design_templates dt
  WHERE dt.enabled = true
    AND dt.main_category = 'Interior Design'
    AND dt.room_type = p_room_type
  ORDER BY dt.sort_order, dt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_templates_by_room_type IS '获取指定房间类型的所有启用模板';

-- ============================================
-- 第 5 部分: 更新 get_templates_by_category 函数
-- ============================================

-- 重新创建函数以包含 room_type
CREATE OR REPLACE FUNCTION public.get_templates_by_category(
  p_main_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  main_category TEXT,
  sub_category TEXT,
  room_type TEXT,
  templates JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.main_category,
    dt.sub_category,
    dt.room_type,
    jsonb_agg(
      jsonb_build_object(
        'id', dt.id,
        'name', dt.name,
        'imageUrl', dt.image_url,
        'prompt', dt.prompt,
        'category', dt.main_category,
        'roomType', dt.room_type
      ) ORDER BY dt.sort_order, dt.name
    ) as templates
  FROM public.design_templates dt
  WHERE dt.enabled = true
    AND (p_main_category IS NULL OR dt.main_category = p_main_category)
  GROUP BY dt.main_category, dt.sub_category, dt.room_type
  ORDER BY dt.main_category, dt.sub_category, dt.room_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 完成！
-- ============================================

-- 使用说明：
-- 1. 在 Supabase SQL Editor 中执行此迁移
-- 2. room_type字段现在可用于按房间类型筛选Interior Design模板
-- 3. 其他分类（Exterior, Wall Paint等）的room_type为NULL
-- 4. 前端可以使用 get_templates_by_room_type('living-room') 获取特定房间的模板


