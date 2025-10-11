-- ============================================
-- 用户认证和会员系统数据库设计
-- ============================================
-- 创建时间: 2025-01-09
-- 描述: 创建用户表、会员等级、信用点系统
-- ============================================

-- 1. 创建用户信息表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro', 'premium', 'business')),
  credits INTEGER DEFAULT 0,
  total_generations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 绑定触发器到users表
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON public.users(membership_tier);

-- 5. 启用行级安全策略 (RLS - Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略：用户只能读取自己的数据
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 7. 创建RLS策略：用户可以更新自己的数据
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 8. 创建RLS策略：允许用户注册时插入数据
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 9. 创建函数：用户注册后自动创建用户记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建触发器：auth.users 新增用户时自动创建对应记录
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. 添加表和字段注释
COMMENT ON TABLE public.users IS '用户信息表，存储会员等级、信用点等信息';
COMMENT ON COLUMN public.users.id IS '用户ID，关联 auth.users';
COMMENT ON COLUMN public.users.email IS '用户邮箱';
COMMENT ON COLUMN public.users.membership_tier IS '会员等级：free(免费), pro(专业版), premium(高级版), business(企业版)';
COMMENT ON COLUMN public.users.credits IS '剩余信用点数，用于生成图片（新用户默认0点）';
COMMENT ON COLUMN public.users.total_generations IS '总生成次数统计';

-- ============================================
-- 会员等级说明
-- ============================================
-- free:     0 credits 起始，需要购买
-- pro:      1000 credits，高级功能
-- premium:  500 credits/月，优先队列
-- business: 无限 credits，专属支持
-- ============================================

