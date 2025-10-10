-- ============================================
-- 【强力清理 - 彻底删除所有冲突】
-- ============================================

-- 删除所有 is_admin 相关函数（无论签名如何）
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'is_admin' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                      func_record.proname, 
                      func_record.args);
    END LOOP;
END $$;

-- 删除其他可能冲突的函数
DO $$ 
DECLARE
    func_name TEXT;
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname IN ('get_template_prompt', 'get_template_prompts', 'get_templates_by_category')
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                      func_record.proname, 
                      func_record.args);
    END LOOP;
END $$;

-- 删除视图
DROP VIEW IF EXISTS public.design_templates_public CASCADE;

-- 删除所有相关的 RLS 策略
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'design_templates' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.design_templates', policy_record.policyname);
    END LOOP;
END $$;

-- ============================================
-- 修复模板系统 RLS 策略并实现提示词保护
-- ============================================

-- 第 1 部分: 创建安全的管理员检查函数
-- 【重要】这个函数接受可选参数以兼容 adminService.ts
CREATE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 如果提供了 check_user_id，使用它；否则使用当前认证用户
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = target_user_id
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin(UUID) IS '安全检查用户是否为活跃管理员，支持检查指定用户或当前用户';

-- 第 2 部分: 修复字段默认值
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'design_templates' 
        AND column_name = 'created_by' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.design_templates
          ALTER COLUMN created_by DROP NOT NULL,
          ALTER COLUMN updated_by DROP NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.design_templates.created_by IS '创建者用户ID（可选）';
COMMENT ON COLUMN public.design_templates.updated_by IS '更新者用户ID（可选）';

-- 第 3 部分: 创建新的 RLS 策略
CREATE POLICY "Users can view enabled templates"
  ON public.design_templates FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can view all templates"
  ON public.design_templates FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create templates"
  ON public.design_templates FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update templates"
  ON public.design_templates FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete templates"
  ON public.design_templates FOR DELETE
  USING (public.is_admin());

-- 第 4 部分: 创建公共视图（隐藏提示词）
CREATE VIEW public.design_templates_public AS
SELECT 
  id, name, image_url,
  main_category, sub_category,
  enabled, sort_order,
  created_at, updated_at
FROM public.design_templates
WHERE enabled = true;

COMMENT ON VIEW public.design_templates_public IS '公共模板视图，不包含提示词内容';

GRANT SELECT ON public.design_templates_public TO anon, authenticated;

-- 第 5 部分: 创建提示词获取函数
CREATE FUNCTION public.get_template_prompt(template_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_prompt TEXT;
BEGIN
  SELECT prompt INTO template_prompt
  FROM public.design_templates
  WHERE id = template_id AND enabled = true;
  RETURN template_prompt;
END;
$$;

COMMENT ON FUNCTION public.get_template_prompt(UUID) IS '获取指定模板的提示词';

GRANT EXECUTE ON FUNCTION public.get_template_prompt(UUID) TO authenticated;

-- 第 6 部分: 批量获取函数
CREATE FUNCTION public.get_template_prompts(template_ids UUID[])
RETURNS TABLE(id UUID, prompt TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT dt.id, dt.prompt
  FROM public.design_templates dt
  WHERE dt.id = ANY(template_ids) AND dt.enabled = true;
END;
$$;

COMMENT ON FUNCTION public.get_template_prompts(UUID[]) IS '批量获取多个模板的提示词';

GRANT EXECUTE ON FUNCTION public.get_template_prompts(UUID[]) TO authenticated;

-- 第 7 部分: 更新分类函数
CREATE FUNCTION public.get_templates_by_category(p_main_category TEXT DEFAULT NULL)
RETURNS TABLE (
  main_category TEXT,
  sub_category TEXT,
  templates JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

COMMENT ON FUNCTION public.get_templates_by_category(TEXT) IS '获取按分类组织的模板（包含 prompt）';

GRANT EXECUTE ON FUNCTION public.get_templates_by_category(TEXT) TO authenticated;

-- ✅ 完成验证
SELECT 
  'Migration v2 completed successfully!' as status,
  'Admin check function with parameter: ' || (public.is_admin(NULL) IS NOT NULL)::text as admin_function_test;

-- 显示创建的对象
SELECT 'Created functions:' as info;
SELECT routine_name, 
       routine_type,
       CASE 
         WHEN data_type IS NOT NULL THEN data_type
         ELSE 'void'
       END as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'get_template_prompt', 'get_template_prompts', 'get_templates_by_category')
ORDER BY routine_name;

SELECT 'Created view:' as info;
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public' 
AND table_name = 'design_templates_public';

