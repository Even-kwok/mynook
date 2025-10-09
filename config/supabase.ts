/**
 * Supabase 客户端配置
 * 用于用户认证、数据库操作等
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.log('Current URL:', supabaseUrl);
  console.log('Key exists:', !!supabaseAnonKey);
} else {
  console.log('✅ Supabase config loaded:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length,
  });
}

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
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

