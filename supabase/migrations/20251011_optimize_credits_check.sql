-- 优化信用点检查和扣除的数据库函数
-- 合并检查和扣除操作，减少往返次数

-- 创建函数：检查并扣除信用点（原子操作）
CREATE OR REPLACE FUNCTION check_and_deduct_credits(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_membership_tier TEXT;
    v_total_generations INTEGER;
    v_new_credits INTEGER;
    v_result JSON;
BEGIN
    -- 锁定用户行，防止并发问题
    SELECT credits, membership_tier, total_generations
    INTO v_current_credits, v_membership_tier, v_total_generations
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- 检查用户是否存在
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found',
            'remaining_credits', 0
        );
    END IF;

    -- 检查信用点是否足够
    IF v_current_credits < p_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'remaining_credits', v_current_credits,
            'required', p_amount
        );
    END IF;

    -- 扣除信用点并增加生成次数
    v_new_credits := v_current_credits - p_amount;
    
    UPDATE users
    SET 
        credits = v_new_credits,
        total_generations = v_total_generations + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 返回成功结果
    RETURN json_build_object(
        'success', true,
        'remaining_credits', v_new_credits,
        'membership_tier', v_membership_tier
    );
END;
$$;

-- 创建函数：回滚信用点（用于失败时）
CREATE OR REPLACE FUNCTION refund_credits(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_total_generations INTEGER;
    v_new_credits INTEGER;
BEGIN
    -- 获取当前状态
    SELECT credits, total_generations
    INTO v_current_credits, v_total_generations
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- 检查用户是否存在
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- 回滚信用点并减少生成次数
    v_new_credits := v_current_credits + p_amount;
    
    UPDATE users
    SET 
        credits = v_new_credits,
        total_generations = GREATEST(0, v_total_generations - 1),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 返回成功结果
    RETURN json_build_object(
        'success', true,
        'refunded_credits', v_new_credits
    );
END;
$$;

-- 添加注释
COMMENT ON FUNCTION check_and_deduct_credits IS '原子性地检查并扣除用户信用点，用于减少数据库往返次数';
COMMENT ON FUNCTION refund_credits IS '回滚信用点，用于操作失败时';

