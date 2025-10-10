-- =====================================================
-- 更新特定用户为 Premium 会员
-- 用户邮箱: 4835300@qq.com
-- 执行时间: 2025-10-10
-- =====================================================

-- 1. 查看当前用户信息（执行前检查）
SELECT 
    id,
    email,
    membership_tier,
    credits,
    created_at
FROM users 
WHERE email = '4835300@qq.com';

-- 2. 更新用户为 Premium 会员
UPDATE users
SET 
    membership_tier = 'premium',
    credits = 5000,  -- Premium 默认 5000 信用点
    updated_at = NOW()
WHERE email = '4835300@qq.com';

-- 3. 验证更新结果
SELECT 
    id,
    email,
    membership_tier,
    credits,
    updated_at
FROM users 
WHERE email = '4835300@qq.com';

-- =====================================================
-- 执行说明：
-- 1. 登录 Supabase Dashboard
-- 2. 进入项目的 SQL Editor
-- 3. 复制并执行上述 SQL 语句
-- 4. 确认更新成功
-- =====================================================

-- 如果需要回滚（恢复为 Free 或 Pro）
/*
UPDATE users
SET 
    membership_tier = 'free',  -- 或 'pro'
    credits = 0,  -- free: 0, pro: 1000
    updated_at = NOW()
WHERE email = '4835300@qq.com';
*/

