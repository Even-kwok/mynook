-- =====================================================
-- 修复Business用户信用点显示问题
-- 创建日期: 2025-10-10
-- 说明: 确保所有Business用户都有正确的信用点配置
-- =====================================================

-- 1. 查看当前Business用户的信用点情况
SELECT 
    id,
    email,
    membership_tier,
    credits,
    total_generations,
    created_at,
    updated_at
FROM users
WHERE membership_tier = 'business'
ORDER BY created_at DESC;

-- 2. 更新所有Business用户的信用点为25,000
-- 如果您确认需要更新，请执行以下语句：
/*
UPDATE users 
SET 
    credits = 25000,
    updated_at = NOW()
WHERE membership_tier = 'business'
  AND (credits IS NULL OR credits != 25000);
*/

-- 3. 检查更新后的结果
/*
SELECT 
    id,
    email,
    membership_tier,
    credits,
    total_generations,
    updated_at
FROM users
WHERE membership_tier = 'business'
ORDER BY updated_at DESC;
*/

-- 4. 查看所有会员等级的统计信息
SELECT 
    membership_tier,
    COUNT(*) as user_count,
    AVG(credits) as avg_credits,
    MIN(credits) as min_credits,
    MAX(credits) as max_credits,
    SUM(total_generations) as total_gens
FROM users
GROUP BY membership_tier
ORDER BY 
    CASE membership_tier
        WHEN 'free' THEN 1
        WHEN 'pro' THEN 2
        WHEN 'premium' THEN 3
        WHEN 'business' THEN 4
    END;

