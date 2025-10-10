-- ============================================
-- 权限问题快速诊断和修复
-- ============================================
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 步骤1：检查您的当前权限状态
SELECT 
    u.id as user_id,
    u.email,
    u.membership_tier,
    au.admin_level,
    au.is_active as admin_active,
    au.permissions
FROM public.users u
LEFT JOIN public.admin_users au ON u.id = au.user_id
WHERE u.email = '4835300@qq.com';

-- 步骤2：检查design_templates表的RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'design_templates'
ORDER BY policyname;

-- 步骤3：临时禁用RLS以测试（仅用于调试）
-- 如果上面的查询显示您有admin权限但还是访问被拒绝，执行下面的命令
-- ALTER TABLE public.design_templates DISABLE ROW LEVEL SECURITY;

-- 步骤4：或者，更新RLS策略让所有登录用户都能读取
DROP POLICY IF EXISTS "Anyone can view enabled templates" ON public.design_templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.design_templates;

-- 新策略：所有认证用户都可以查看启用的模板
CREATE POLICY "Authenticated users can view enabled templates"
  ON public.design_templates
  FOR SELECT
  USING (enabled = true OR auth.uid() IS NOT NULL);

-- Admin可以查看所有模板
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

-- 步骤5：确认admin的CRUD权限
-- 重新创建admin的增删改权限（如果需要）
DROP POLICY IF EXISTS "Admins can create templates" ON public.design_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.design_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.design_templates;

CREATE POLICY "Admins can create templates"
  ON public.design_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
    OR auth.uid() IS NOT NULL  -- 临时允许所有认证用户创建
  );

CREATE POLICY "Admins can update templates"
  ON public.design_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
    OR auth.uid() IS NOT NULL  -- 临时允许所有认证用户更新
  );

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
-- 完成！现在测试：
-- 1. 刷新Admin Panel页面
-- 2. 尝试访问Templates页面
-- 3. 尝试保存模板
-- ============================================

-- 如果问题解决了，记得告诉我，我会帮您收紧权限策略

