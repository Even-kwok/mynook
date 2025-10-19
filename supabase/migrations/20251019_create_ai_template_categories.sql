-- ============================================
-- AI Template Categories 动态分类管理系统
-- ============================================
-- 创建时间: 2025-10-19
-- 描述: 为 AI Template Creator 创建可管理的分类系统
-- 允许后台动态添加/编辑/删除分类，AI根据选中的分类范围进行识别
-- ============================================

-- 创建 AI 分类管理表
CREATE TABLE IF NOT EXISTS public.ai_template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  category_slug TEXT NOT NULL UNIQUE,  -- URL友好的标识符
  description TEXT,  -- 分类描述，显示给用户
  ai_recognition_hint TEXT,  -- AI识别提示关键词，用于生成提示词
  example_keywords TEXT,  -- 示例关键词，帮助用户理解
  enabled BOOLEAN DEFAULT true,  -- 是否启用
  sort_order INTEGER DEFAULT 0,  -- 排序顺序
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_ai_categories_enabled ON public.ai_template_categories(enabled, sort_order);
CREATE INDEX IF NOT EXISTS idx_ai_categories_slug ON public.ai_template_categories(category_slug);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_ai_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_categories_updated_at
  BEFORE UPDATE ON public.ai_template_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_categories_updated_at();

-- 启用 RLS
ALTER TABLE public.ai_template_categories ENABLE ROW LEVEL SECURITY;

-- RLS 策略：公开读取已启用的分类
CREATE POLICY "Public read enabled categories" ON public.ai_template_categories
  FOR SELECT 
  TO public
  USING (enabled = true);

-- RLS 策略：管理员完全访问
CREATE POLICY "Admin full access to categories" ON public.ai_template_categories
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 插入现有的所有功能分类
INSERT INTO public.ai_template_categories (category_name, category_slug, description, ai_recognition_hint, example_keywords, enabled, sort_order) VALUES
('Interior Design', 'interior-design', '室内设计和装修', 'Indoor spaces, rooms, living spaces, furniture arrangement, interior decoration', '客厅、卧室、厨房、家具布局', true, 1),
('Exterior Design', 'exterior-design', '建筑外观设计', 'Building facades, architectural exteriors, house exteriors, building design', '建筑外观、房屋外立面、庭院', true, 2),
('Wall Paint', 'wall-paint', '墙面颜色和涂料', 'Wall colors, paint, wall finishes, wall textures, paint schemes', '墙面颜色、涂料、墙面质感', true, 3),
('Floor Style', 'floor-style', '地板材质和风格', 'Flooring materials, floor patterns, hardwood, tile, laminate, marble, wood grain', '木地板、瓷砖、大理石、地板纹理', true, 4),
('Garden & Backyard Design', 'garden-backyard', '花园和户外景观', 'Gardens, landscaping, outdoor spaces, backyard, plants, pathways', '花园、绿植、户外景观、小径', true, 5),
('Festival Decoration', 'festival', '节日装饰和主题', 'Holiday decorations, seasonal themes, festive designs, Christmas, Halloween, Easter, celebrations', '圣诞、万圣节、春节、节日布置', true, 6),
('Item Replace', 'item-replace', '物品替换和更新', 'Furniture replacement, decor swapping, item changes, object substitution', '家具替换、装饰更换、物品变更', true, 7),
('Reference Style Match', 'style-match', '参考风格匹配', 'Style matching, design replication, reference-based design, aesthetic copying', '风格匹配、设计复制、参考设计', true, 8),
('Free Canvas', 'free-canvas', '自由创作画布', 'Custom designs, free drawing, creative canvas, blank space design', '自由绘制、创意设计、空白画布', true, 9)
ON CONFLICT (category_slug) DO NOTHING;

-- 添加表和字段注释
COMMENT ON TABLE public.ai_template_categories IS 'AI 模板创建功能的动态分类管理表';
COMMENT ON COLUMN public.ai_template_categories.category_name IS '分类显示名称（用户界面显示）';
COMMENT ON COLUMN public.ai_template_categories.category_slug IS '分类标识符（URL友好，用于代码识别）';
COMMENT ON COLUMN public.ai_template_categories.description IS '分类描述（显示给用户，说明此分类的用途）';
COMMENT ON COLUMN public.ai_template_categories.ai_recognition_hint IS 'AI识别提示关键词（用于动态生成Gemini提示词）';
COMMENT ON COLUMN public.ai_template_categories.example_keywords IS '示例关键词（帮助用户理解该分类适用场景）';
COMMENT ON COLUMN public.ai_template_categories.enabled IS '是否启用（禁用的分类不会在前端显示）';
COMMENT ON COLUMN public.ai_template_categories.sort_order IS '排序顺序（数字越小越靠前）';

-- ============================================
-- 完成！
-- ============================================
-- 使用说明：
-- 1. 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- 2. 前端会自动从此表读取分类列表
-- 3. 管理员可以在 Admin Panel 中管理分类
-- 4. AI 会根据用户选择的分类动态生成识别提示词
-- ============================================

