-- ============================================
-- 快速修复：模板系统 + Admin权限
-- ============================================
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 第1步：创建模板表（如果还没有的话）
CREATE TABLE IF NOT EXISTS public.design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

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

-- 第2步：创建索引
CREATE INDEX IF NOT EXISTS idx_templates_main_category ON public.design_templates(main_category);
CREATE INDEX IF NOT EXISTS idx_templates_sub_category ON public.design_templates(sub_category);
CREATE INDEX IF NOT EXISTS idx_templates_enabled ON public.design_templates(enabled);
CREATE INDEX IF NOT EXISTS idx_templates_sort_order ON public.design_templates(sort_order);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.design_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_main ON public.template_categories(main_category);
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON public.template_categories(enabled);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.template_categories(sort_order);

-- 第3步：创建触发器
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.design_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.template_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 第4步：启用RLS
ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;

-- 第5步：创建RLS策略
DROP POLICY IF EXISTS "Anyone can view enabled templates" ON public.design_templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.design_templates;
DROP POLICY IF EXISTS "Admins can create templates" ON public.design_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.design_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.design_templates;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.template_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.template_categories;

CREATE POLICY "Anyone can view enabled templates"
  ON public.design_templates FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can view all templates"
  ON public.design_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can create templates"
  ON public.design_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can update templates"
  ON public.design_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can delete templates"
  ON public.design_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Anyone can view categories"
  ON public.template_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.template_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 第6步：插入分类数据
INSERT INTO public.template_categories (main_category, sub_category, display_name, sort_order) VALUES
  ('Interior Design', 'Design Aesthetics', 'Design Aesthetics', 10),
  ('Interior Design', 'Architectural Styles', 'Architectural Styles', 20),
  ('Exterior Design', 'Architectural Styles', 'Architectural Styles', 10),
  ('Wall Paint', 'Colors', 'Paint Colors', 10),
  ('Floor Style', 'Materials', 'Floor Materials', 10),
  ('Garden', 'Landscape Styles', 'Landscape Styles', 10),
  ('Festive Decor', 'Holidays', 'Holiday Themes', 10)
ON CONFLICT (main_category, sub_category) DO NOTHING;

-- 第7步：确认您的Admin权限
-- 🔥🔥🔥 修改这里的邮箱为您登录的邮箱 🔥🔥🔥
DO $$
DECLARE
  v_user_id UUID;
  v_admin_email TEXT := 'YOUR-EMAIL@example.com'; -- ⬅️ 改成您的邮箱
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = v_admin_email;
  
  IF v_user_id IS NOT NULL THEN
    -- 确保有admin记录
    INSERT INTO public.admin_users (
      user_id, admin_level, is_active, permissions, created_by
    ) VALUES (
      v_user_id, 'super_admin', true, '["manage_all"]'::jsonb, v_user_id
    )
    ON CONFLICT (user_id) DO UPDATE SET
      admin_level = 'super_admin',
      is_active = true,
      permissions = '["manage_all"]'::jsonb;
    
    -- 升级为Business会员
    UPDATE public.users SET membership_tier = 'business' WHERE id = v_user_id;
    
    RAISE NOTICE '✅ 设置成功！用户 % 现在是超级管理员', v_admin_email;
  ELSE
    RAISE NOTICE '❌ 找不到用户：%', v_admin_email;
  END IF;
END $$;

-- ============================================
-- 完成！现在刷新页面试试
-- ============================================

