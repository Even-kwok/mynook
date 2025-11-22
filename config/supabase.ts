/**
 * Supabase 客户端配置
 * 用于用户认证、数据库操作等
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 从环境变量获取配置 - 使用 NEXT_PUBLIC_ 前缀确保在客户端可用
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 验证环境变量（仅在客户端）
if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  } else {
    console.log('✅ Supabase config loaded');
  }
}

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'X-Client-Info': 'mynook-app',
      },
    },
  }
);

// 导出类型以便在其他地方使用
export type SupabaseClient = typeof supabase;
