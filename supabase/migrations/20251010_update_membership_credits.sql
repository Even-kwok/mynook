-- =====================================================
-- 会员等级和信用点系统更新迁移脚本
-- 创建日期: 2025-10-10
-- 说明: 更新所有会员等级的默认信用点配置
-- =====================================================

-- 1. 备份当前数据（可选，建议在生产环境执行前做完整备份）
-- 创建备份表
CREATE TABLE IF NOT EXISTS users_backup_20251010 AS 
SELECT * FROM users;

-- 2. 更新各等级用户的信用点
-- 注意：这里只更新信用点为旧默认值的用户
-- 如果用户已经消耗了信用点，不会被重置

-- 更新 Free 用户（从 10 → 0）
-- 只更新那些信用点还是默认值 10 的用户
UPDATE users 
SET credits = 0,
    updated_at = NOW()
WHERE membership_tier = 'free' 
  AND credits = 10;

-- 更新 Pro 用户（从 100 → 1000）
-- 只更新那些信用点还是默认值 100 的用户
UPDATE users 
SET credits = 1000,
    updated_at = NOW()
WHERE membership_tier = 'pro' 
  AND credits = 100;

-- 更新 Premium 用户（从 500 → 5000）
-- 只更新那些信用点还是默认值 500 的用户
UPDATE users 
SET credits = 5000,
    updated_at = NOW()
WHERE membership_tier = 'premium' 
  AND credits = 500;

-- 更新 Business 用户（设置为 25000）
-- Business 用户之前可能是 -1（无限）或其他值
-- 统一更新为 25000
UPDATE users 
SET credits = 25000,
    updated_at = NOW()
WHERE membership_tier = 'business';

-- 3. 添加注释记录变更
COMMENT ON TABLE users IS '用户表 - 最后更新: 2025-10-10, 更新了会员等级信用点配置';

-- 4. 查看更新后的统计信息
-- 执行以下查询查看各等级的用户分布和平均信用点
SELECT 
    membership_tier,
    COUNT(*) as user_count,
    AVG(credits) as avg_credits,
    MIN(credits) as min_credits,
    MAX(credits) as max_credits
FROM users
GROUP BY membership_tier
ORDER BY 
    CASE membership_tier
        WHEN 'free' THEN 1
        WHEN 'pro' THEN 2
        WHEN 'premium' THEN 3
        WHEN 'business' THEN 4
    END;

-- =====================================================
-- 回滚脚本（如需要回滚，执行以下语句）
-- =====================================================
/*
-- 从备份恢复数据
UPDATE users u
SET credits = b.credits,
    updated_at = NOW()
FROM users_backup_20251010 b
WHERE u.id = b.id;

-- 删除备份表（确认回滚成功后）
-- DROP TABLE users_backup_20251010;
*/

