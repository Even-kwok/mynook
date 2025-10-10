-- ============================================
-- 模板管理系统
-- ============================================
-- 创建时间: 2025-10-10
-- 描述: 创建设计模板表，支持Admin后台管理和前端展示
-- ============================================

-- ============================================
-- 第 1 部分: 创建模板表
-- ============================================

CREATE TABLE IF NOT EXISTS public.design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 基本信息
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  
  -- 分类信息
  main_category TEXT NOT NULL, -- 主分类：Interior Design, Exterior Design, Wall Paint, etc.
  sub_category TEXT NOT NULL,  -- 子分类：Architectural Styles, Design Aesthetics, etc.
  
  -- 状态和排序
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- ============================================
-- 第 2 部分: 创建分类配置表
-- ============================================

CREATE TABLE IF NOT EXISTS public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(main_category, sub_category)
);

-- ============================================
-- 第 3 部分: 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_templates_main_category ON public.design_templates(main_category);
CREATE INDEX IF NOT EXISTS idx_templates_sub_category ON public.design_templates(sub_category);
CREATE INDEX IF NOT EXISTS idx_templates_enabled ON public.design_templates(enabled);
CREATE INDEX IF NOT EXISTS idx_templates_sort_order ON public.design_templates(sort_order);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.design_templates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_main ON public.template_categories(main_category);
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON public.template_categories(enabled);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.template_categories(sort_order);

-- ============================================
-- 第 4 部分: 创建更新时间触发器
-- ============================================

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.design_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.template_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 第 5 部分: 启用 RLS
-- ============================================

ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 第 6 部分: RLS 策略 - design_templates
-- ============================================

-- 所有用户可以查看已启用的模板
CREATE POLICY "Anyone can view enabled templates"
  ON public.design_templates
  FOR SELECT
  USING (enabled = true);

-- 管理员可以查看所有模板
CREATE POLICY "Admins can view all templates"
  ON public.design_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 管理员可以创建模板
CREATE POLICY "Admins can create templates"
  ON public.design_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 管理员可以更新模板
CREATE POLICY "Admins can update templates"
  ON public.design_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 管理员可以删除模板
CREATE POLICY "Admins can delete templates"
  ON public.design_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================
-- 第 7 部分: RLS 策略 - template_categories
-- ============================================

-- 所有用户可以查看分类
CREATE POLICY "Anyone can view categories"
  ON public.template_categories
  FOR SELECT
  USING (true);

-- 管理员可以管理分类
CREATE POLICY "Admins can manage categories"
  ON public.template_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================
-- 第 8 部分: 辅助函数
-- ============================================

-- 获取所有启用的模板（按分类分组）
CREATE OR REPLACE FUNCTION public.get_templates_by_category(
  p_main_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  main_category TEXT,
  sub_category TEXT,
  templates JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.main_category,
    dt.sub_category,
    jsonb_agg(
      jsonb_build_object(
        'id', dt.id,
        'name', dt.name,
        'imageUrl', dt.image_url,
        'prompt', dt.prompt,
        'category', dt.main_category
      ) ORDER BY dt.sort_order, dt.name
    ) as templates
  FROM public.design_templates dt
  WHERE dt.enabled = true
    AND (p_main_category IS NULL OR dt.main_category = p_main_category)
  GROUP BY dt.main_category, dt.sub_category
  ORDER BY dt.main_category, dt.sub_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取分类列表
CREATE OR REPLACE FUNCTION public.get_template_categories()
RETURNS TABLE (
  main_category TEXT,
  sub_categories JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.main_category,
    jsonb_agg(
      jsonb_build_object(
        'name', tc.sub_category,
        'displayName', tc.display_name,
        'enabled', tc.enabled,
        'sortOrder', tc.sort_order
      ) ORDER BY tc.sort_order, tc.sub_category
    ) as sub_categories
  FROM public.template_categories tc
  WHERE tc.enabled = true
  GROUP BY tc.main_category
  ORDER BY tc.main_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 第 9 部分: 添加注释
-- ============================================

COMMENT ON TABLE public.design_templates IS '设计模板表，存储所有AI生成模板的信息';
COMMENT ON TABLE public.template_categories IS '模板分类配置表';

COMMENT ON COLUMN public.design_templates.name IS '模板名称';
COMMENT ON COLUMN public.design_templates.image_url IS '模板预览图URL';
COMMENT ON COLUMN public.design_templates.prompt IS 'AI生成提示词';
COMMENT ON COLUMN public.design_templates.main_category IS '主分类：Interior Design, Exterior Design等';
COMMENT ON COLUMN public.design_templates.sub_category IS '子分类：Architectural Styles, Design Aesthetics等';
COMMENT ON COLUMN public.design_templates.enabled IS '是否启用该模板';
COMMENT ON COLUMN public.design_templates.sort_order IS '排序顺序，数字越小越靠前';

-- ============================================
-- 第 10 部分: 初始化分类数据
-- ============================================

INSERT INTO public.template_categories (main_category, sub_category, display_name, sort_order) VALUES
  -- Interior Design 分类
  ('Interior Design', 'Design Aesthetics', 'Design Aesthetics', 10),
  ('Interior Design', 'Architectural Styles', 'Architectural Styles', 20),
  
  -- Exterior Design 分类
  ('Exterior Design', 'Architectural Styles', 'Architectural Styles', 10),
  
  -- Wall Paint 分类
  ('Wall Paint', 'Colors', 'Paint Colors', 10),
  
  -- Floor Style 分类
  ('Floor Style', 'Materials', 'Floor Materials', 10),
  
  -- Garden 分类
  ('Garden', 'Landscape Styles', 'Landscape Styles', 10),
  
  -- Festive Decor 分类
  ('Festive Decor', 'Holidays', 'Holiday Themes', 10)
ON CONFLICT (main_category, sub_category) DO NOTHING;

-- ============================================
-- 完成！
-- ============================================

-- 使用说明：
-- 1. 执行此迁移创建模板系统
-- 2. 使用 templateService 导入现有模板数据
-- 3. Admin后台可以通过API管理模板
-- 4. 前端通过 get_templates_by_category() 函数获取模板

