/**
 * Supabase 客户端配置
 * 用于用户认证、数据库操作等
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 从环境变量获取配置 (优先使用 import.meta.env，其次使用 process.env)
// Note: process.env is polyfilled by Vite define plugin
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  '';

// 验证环境变量 (仅在开发环境或非构建环境抛出警告，避免构建失败)
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  }
} else if (import.meta.env.DEV) {
  console.log('✅ Supabase config loaded');
}

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
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
