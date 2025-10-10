-- ============================================
-- 管理员权限系统
-- ============================================
-- 创建时间: 2025-01-11
-- 描述: 创建管理员用户表、权限系统、操作日志
-- ============================================

-- ============================================
-- 第 1 部分: 创建管理员级别枚举
-- ============================================

CREATE TYPE admin_level AS ENUM ('super_admin', 'content_admin', 'support_admin');

-- ============================================
-- 第 2 部分: 创建管理员用户表
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_level admin_level NOT NULL DEFAULT 'content_admin',
  permissions JSONB DEFAULT '[]'::jsonb, -- 具体权限配置数组
  created_by UUID REFERENCES public.users(id), -- 谁创建的这个管理员
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id) -- 一个用户只能有一个管理员记录
);

-- ============================================
-- 第 3 部分: 创建管理操作日志表
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id), -- 执行操作的用户
  action TEXT NOT NULL, -- 操作类型：'upload_image', 'delete_user', 'update_user', etc
  target_type TEXT, -- 目标类型：'user', 'gallery_item', 'template', etc
  target_id UUID, -- 目标ID
  details JSONB, -- 详细信息
  ip_address TEXT, -- IP地址
  user_agent TEXT, -- 浏览器信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 第 4 部分: 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_level ON public.admin_users(admin_level);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON public.admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);

-- ============================================
-- 第 5 部分: 启用 RLS
-- ============================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 第 6 部分: RLS 策略 - admin_users
-- ============================================

-- 只有超级管理员可以查看所有管理员
CREATE POLICY "Super admins can view all admins"
  ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND admin_level = 'super_admin'
      AND is_active = true
    )
  );

-- 管理员可以查看自己的记录
CREATE POLICY "Admins can view own record"
  ON public.admin_users
  FOR SELECT
  USING (user_id = auth.uid() AND is_active = true);

-- 只有超级管理员可以创建新管理员
CREATE POLICY "Super admins can create admins"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND admin_level = 'super_admin'
      AND is_active = true
    )
  );

-- 只有超级管理员可以更新管理员
CREATE POLICY "Super admins can update admins"
  ON public.admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND admin_level = 'super_admin'
      AND is_active = true
    )
  );

-- 只有超级管理员可以删除管理员
CREATE POLICY "Super admins can delete admins"
  ON public.admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND admin_level = 'super_admin'
      AND is_active = true
    )
  );

-- ============================================
-- 第 7 部分: RLS 策略 - admin_logs
-- ============================================

-- 超级管理员可以查看所有日志
CREATE POLICY "Super admins can view all logs"
  ON public.admin_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND admin_level = 'super_admin'
      AND is_active = true
    )
  );

-- 管理员可以查看自己的操作日志
CREATE POLICY "Admins can view own logs"
  ON public.admin_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 所有管理员都可以插入日志
CREATE POLICY "Admins can insert logs"
  ON public.admin_logs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================
-- 第 8 部分: 辅助函数
-- ============================================

-- 检查用户是否是管理员
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = check_user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否是超级管理员
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = check_user_id
    AND admin_level = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取管理员级别
CREATE OR REPLACE FUNCTION public.get_admin_level(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  level TEXT;
BEGIN
  SELECT admin_level::TEXT INTO level
  FROM public.admin_users
  WHERE user_id = check_user_id
  AND is_active = true;
  
  RETURN COALESCE(level, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 记录管理员操作日志
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
BEGIN
  -- 获取当前用户的 admin_id
  SELECT id INTO v_admin_id
  FROM public.admin_users
  WHERE user_id = auth.uid()
  AND is_active = true;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;
  
  -- 插入日志记录
  INSERT INTO public.admin_logs (
    admin_id,
    user_id,
    action,
    target_type,
    target_id,
    details,
    ip_address
  ) VALUES (
    v_admin_id,
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    current_setting('request.headers', true)::json->>'x-real-ip'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 第 9 部分: 更新 last_login 触发器
-- ============================================

CREATE OR REPLACE FUNCTION public.update_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.admin_users
  SET last_login = NOW()
  WHERE user_id = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 第 10 部分: 添加注释
-- ============================================

COMMENT ON TABLE public.admin_users IS '管理员用户表，存储管理员权限和级别';
COMMENT ON TABLE public.admin_logs IS '管理员操作日志表，记录所有管理操作';

COMMENT ON COLUMN public.admin_users.admin_level IS '管理员级别：super_admin(超级管理员), content_admin(内容管理员), support_admin(客服管理员)';
COMMENT ON COLUMN public.admin_users.permissions IS 'JSONB数组，存储具体权限如["manage_gallery", "manage_users"]';

COMMENT ON COLUMN public.admin_logs.action IS '操作类型：upload_image, delete_user, update_user_tier, etc';
COMMENT ON COLUMN public.admin_logs.target_type IS '目标类型：user, gallery_item, template';

-- ============================================
-- 第 11 部分: 创建首个超级管理员（示例）
-- ============================================

-- 注意：请修改邮箱地址为你的实际管理员邮箱
-- 执行此脚本前，确保该用户已经注册

-- 方法1：通过邮箱创建（推荐）
-- 取消下面的注释并修改邮箱地址
/*
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 获取用户ID
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = 'your-admin-email@example.com';
  
  IF v_user_id IS NOT NULL THEN
    -- 创建超级管理员记录
    INSERT INTO public.admin_users (user_id, admin_level, is_active, permissions)
    VALUES (
      v_user_id,
      'super_admin',
      true,
      '["manage_all"]'::jsonb
    )
    ON CONFLICT (user_id) DO UPDATE
    SET admin_level = 'super_admin',
        is_active = true,
        permissions = '["manage_all"]'::jsonb;
    
    RAISE NOTICE 'Super admin created successfully for user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User not found. Please register first.';
  END IF;
END $$;
*/

-- ============================================
-- 完成！
-- ============================================

-- 使用说明：
-- 1. 执行此迁移文件创建管理员系统
-- 2. 取消注释上面的 DO 块，修改邮箱地址
-- 3. 再次执行以创建首个超级管理员
-- 4. 访问 https://your-domain.com/#admin 进入后台

