/**
 * 用户认证服务
 * 提供注册、登录、登出、获取用户信息等功能
 */

import { supabase } from '../config/supabase';
import type { UserProfile } from '../types/database';
import type { AuthError, User, Session } from '@supabase/supabase-js';

// ===== 类型定义 =====

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// ===== 认证方法 =====

/**
 * 用户注册（邮箱+密码）
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    const { email, password, fullName } = data;
    
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    return {
      user: authData.user,
      session: authData.session,
      error,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * 用户登录（邮箱+密码）
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  try {
    const { email, password } = data;
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: authData.user,
      session: authData.session,
      error,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Google OAuth 登录
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    return { error };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { error: error as AuthError };
  }
}

/**
 * 用户登出
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error as AuthError };
  }
}

/**
 * 获取当前用户会话
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// ===== 用户资料方法 =====

/**
 * 获取用户详细资料（包括会员等级、信用点等）
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get user profile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ data: UserProfile | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Update user profile error:', error);
    return { data: null, error };
  }
}

/**
 * 扣除用户信用点（生成图片时调用）
 */
export async function deductCredits(
  userId: string,
  amount: number = 1
): Promise<{ success: boolean; remainingCredits: number }> {
  try {
    // 1. 获取当前信用点
    const profile = await getUserProfile(userId);
    if (!profile) {
      return { success: false, remainingCredits: 0 };
    }

    // 2. 检查是否有足够信用点（business会员无限制）
    if (profile.membership_tier !== 'business' && profile.credits < amount) {
      return { success: false, remainingCredits: profile.credits };
    }

    // 3. 扣除信用点并增加生成次数
    const newCredits = profile.membership_tier === 'business' 
      ? profile.credits 
      : profile.credits - amount;

    const { error } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        total_generations: profile.total_generations + 1,
      })
      .eq('id', userId);

    if (error) {
      console.error('Deduct credits error:', error);
      return { success: false, remainingCredits: profile.credits };
    }

    return { success: true, remainingCredits: newCredits };
  } catch (error) {
    console.error('Deduct credits error:', error);
    return { success: false, remainingCredits: 0 };
  }
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

