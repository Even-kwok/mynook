/**
 * 服务端信用点管理服务
 * 用于在 Vercel Serverless Functions 中验证和扣除信用点
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration for server-side operations');
}

// 创建服务端 Supabase 客户端（使用 service key，绕过 RLS）
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * 信用点消耗配置
 */
export const CREDIT_COSTS = {
  TEXT_GENERATION: 1,      // 文本生成消耗 1 点
  IMAGE_GENERATION: 1,     // 图片生成消耗 1 点
  IMAGE_EDIT: 3,           // 图片编辑消耗 3 点
  IMAGE_UPSCALE: 1,        // 图片放大消耗 1 点
} as const;

/**
 * 验证用户 token 并获取用户 ID
 */
export async function verifyUserToken(authToken: string): Promise<{ userId: string | null; error: string | null }> {
  try {
    if (!authToken) {
      return { userId: null, error: 'No authorization token provided' };
    }

    // 移除 "Bearer " 前缀
    const token = authToken.replace(/^Bearer\s+/i, '');

    // 验证 JWT token
    const { data, error } = await (supabaseAdmin.auth as any).getUser(token);

    if (error || !data.user) {
      return { userId: null, error: 'Invalid or expired token' };
    }

    return { userId: data.user.id, error: null };
  } catch (error) {
    console.error('Token verification error:', error);
    return { userId: null, error: 'Token verification failed' };
  }
}

/**
 * 获取用户信用点余额
 */
export async function getUserCredits(userId: string): Promise<{ credits: number; membershipTier: string; error: string | null }> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('users')
      .select('credits, membership_tier')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { credits: 0, membershipTier: 'free', error: 'Failed to fetch user credits' };
    }

    // Use any to bypass strict type checking
    const userData = data as any;
    return {
      credits: userData.credits || 0,
      membershipTier: userData.membership_tier || 'free',
      error: null,
    };
  } catch (error) {
    console.error('Get user credits error:', error);
    return { credits: 0, membershipTier: 'free', error: 'Failed to fetch user credits' };
  }
}

/**
 * 检查用户是否有足够的信用点
 */
export async function checkCreditsAvailable(
  userId: string,
  requiredCredits: number
): Promise<{ available: boolean; currentCredits: number; membershipTier: string; error: string | null }> {
  const { credits, membershipTier, error } = await getUserCredits(userId);

  if (error) {
    return { available: false, currentCredits: 0, membershipTier: 'free', error };
  }

  // 所有会员都需要检查信用点余额
  const available = credits >= requiredCredits;
  return { available, currentCredits: credits, membershipTier, error: null };
}

/**
 * 检查并扣除用户信用点（原子操作，优化版本）
 * 使用数据库函数减少往返次数
 */
export async function checkAndDeductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; remainingCredits: number; membershipTier?: string; error: string | null }> {
  try {
    const { data, error } = await (supabaseAdmin as any).rpc('check_and_deduct_credits', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error) {
      console.error('Check and deduct credits error:', error);
      return { success: false, remainingCredits: 0, error: 'Failed to check and deduct credits' };
    }

    const result = data as any;
    return {
      success: result.success,
      remainingCredits: result.remaining_credits || 0,
      membershipTier: result.membership_tier,
      error: result.error || null
    };
  } catch (error) {
    console.error('Check and deduct credits error:', error);
    return { success: false, remainingCredits: 0, error: 'Failed to check and deduct credits' };
  }
}

/**
 * 扣除用户信用点（保留旧版本以保持兼容性）
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; remainingCredits: number; error: string | null }> {
  try {
    // 1. 获取当前用户信息
    const { data: user, error: fetchError } = await (supabaseAdmin as any)
      .from('users')
      .select('credits, membership_tier, total_generations')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return { success: false, remainingCredits: 0, error: 'Failed to fetch user data' };
    }

    // Use any to bypass type checking
    const userData = user as any;
    
    // 2. 所有会员都需要扣除信用点
    const newCredits = userData.credits - amount;

    // 3. 更新数据库
    const updateData: Record<string, any> = {
      credits: newCredits,
      total_generations: userData.total_generations + 1,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await ((supabaseAdmin as any)
      .from('users')
      .update(updateData)
      .eq('id', userId));

    if (updateError) {
      console.error('Deduct credits error:', updateError);
      return { success: false, remainingCredits: userData.credits, error: 'Failed to deduct credits' };
    }

    return { success: true, remainingCredits: newCredits, error: null };
  } catch (error) {
    console.error('Deduct credits error:', error);
    return { success: false, remainingCredits: 0, error: 'Failed to deduct credits' };
  }
}

/**
 * 回滚信用点（优化版本，使用数据库函数）
 */
export async function refundCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await (supabaseAdmin as any).rpc('refund_credits', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error) {
      console.error('Refund credits error:', error);
      return { success: false, error: 'Failed to refund credits' };
    }

    const result = data as any;
    return {
      success: result.success,
      error: result.error || null
    };
  } catch (error) {
    console.error('Refund credits error:', error);
    return { success: false, error: 'Failed to refund credits' };
  }
}

/**
 * 记录生成历史（可选功能，用于追踪）
 */
export interface GenerationLog {
  userId: string;
  type: 'text' | 'image';
  creditsUsed: number;
  success: boolean;
  timestamp: string;
}

export async function logGeneration(log: GenerationLog): Promise<void> {
  // 这里可以添加日志记录到另一个表，用于分析和统计
  console.log('Generation log:', log);
}

