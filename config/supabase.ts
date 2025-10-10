/**
 * Supabase 客户端配置
 * 用于用户认证、数据库操作等
 */

import type { Database } from '../types/database';
import type { createClient as CreateClient } from '@supabase/supabase-js';

type SupabaseModule = {
  createClient: CreateClient;
};

const loadSupabaseClient = async (): Promise<SupabaseModule> => {
  const module = await import(
    /* @vite-ignore */ 'https://esm.sh/@supabase/supabase-js@2.75.0?bundle'
  );
  return module as SupabaseModule;
};

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

const { createClient } = await loadSupabaseClient();

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // 延长session过期时间，避免频繁登出
      flowType: 'pkce', // 使用更安全的PKCE流程
      ...(storage ? { storage } : {}),
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

