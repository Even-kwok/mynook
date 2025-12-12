/**
 * Supabase 客户端配置
 * 用于用户认证、数据库操作等
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { getEnvVar } from '../utils/env';

// 从环境变量获取配置
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const missingSupabaseEnvVars: string[] = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter((v): v is string => Boolean(v));

// 验证环境变量
if (!isSupabaseConfigured) {
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
// IMPORTANT: Do NOT call createClient with empty strings, it will crash the app (white screen).
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
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
    })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            `Supabase is not configured. Missing env vars: ${missingSupabaseEnvVars.join(', ') || 'unknown'}`
          );
        },
      }
    ) as any);

// 导出类型以便在其他地方使用
export type SupabaseClient = typeof supabase;

