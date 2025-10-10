-- ============================================
-- 创建首个超级管理员
-- ============================================
-- 使用说明:
-- 1. 先注册一个账号（通过前端注册）
-- 2. 修改下面的邮箱地址为你的账号邮箱
-- 3. 在 Supabase SQL 编辑器中执行此脚本
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_admin_email TEXT := 'your-email@example.com'; -- 🔥 修改这里为你的邮箱
BEGIN
  -- 获取用户ID
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = v_admin_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '用户不存在！请先注册账号，邮箱: %', v_admin_email;
  END IF;
  
  -- 创建或更新管理员记录
  INSERT INTO public.admin_users (
    user_id,
    admin_level,
    is_active,
    permissions,
    created_by
  ) VALUES (
    v_user_id,
    'super_admin',
    true,
    '["manage_all"]'::jsonb,
    v_user_id -- 自己创建自己
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    admin_level = 'super_admin',
    is_active = true,
    permissions = '["manage_all"]'::jsonb,
    created_at = NOW();
  
  -- 同时将用户升级为 Business 会员（确保前端权限检查通过）
  UPDATE public.users
  SET membership_tier = 'business'
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 超级管理员创建成功！';
  RAISE NOTICE '   用户ID: %', v_user_id;
  RAISE NOTICE '   邮箱: %', v_admin_email;
  RAISE NOTICE '   访问方式: https://your-domain.com/#admin';
  RAISE NOTICE '   快捷键: Ctrl/Cmd + Shift + A';
END $$;

