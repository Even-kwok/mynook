import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './lib/env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Record<string, string> = {};
  const errors: string[] = [];
  const envStatus: Record<string, string> = {};

  try {
    // ========== 检查 1: API 基础响应 ==========
    checks.api = '✅ API responding';

    // ========== 检查 2: 环境变量 ==========
    // 检查 Supabase URL
    const supabaseUrl = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
    envStatus.SUPABASE_URL = supabaseUrl ? '✅ Found' : '❌ Missing';
    
    // 检查 Supabase Service Key
    const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_SERVICE_ROLE_KEY');
    envStatus.SUPABASE_SERVICE_KEY = supabaseServiceKey ? '✅ Found' : '❌ Missing';
    
    // 检查 Supabase Anon Key (可选)
    const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
    envStatus.SUPABASE_ANON_KEY = supabaseAnonKey ? '✅ Found' : '⚠️ Missing (optional)';
    
    // 检查 CREEM (可选)
    const creemApiKey = getEnvVar('CREEM_API_KEY');
    envStatus.CREEM_API_KEY = creemApiKey ? '✅ Found' : '⚠️ Missing (needed for payments)';

    const missingCritical = [];
    if (!supabaseUrl) missingCritical.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingCritical.push('SUPABASE_SERVICE_KEY');
    
    if (missingCritical.length > 0) {
      checks.env = `❌ Missing critical vars: ${missingCritical.join(', ')}`;
      errors.push(`Missing environment variables: ${missingCritical.join(', ')}`);
    } else {
      checks.env = '✅ Critical env vars present';
    }

    // ========== 检查 3: Supabase 连接 ==========
    let supabaseClient;
    try {
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase credentials not found');
      }

      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      
      // 尝试执行简单查询
      const { data, error } = await supabaseClient
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      checks.supabase = '✅ Supabase connected';
    } catch (error: any) {
      checks.supabase = `❌ ${error.message}`;
      errors.push(`Supabase connection failed: ${error.message}`);
    }

    // ========== 检查 4: 用户认证 ==========
    const authHeader = req.headers.authorization;
    let userData = null;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      checks.auth = '⚠️ No auth token provided (optional for this test)';
    } else if (supabaseClient) {
      try {
        const token = authHeader.replace('Bearer ', '');
        
        // 验证 token
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
          checks.auth = `❌ Invalid token: ${authError?.message || 'User not found'}`;
          errors.push('Authentication failed');
        } else {
          // 获取用户详细信息
          const { data: userRecord, error: userError } = await supabaseClient
            .from('users')
            .select('id, email, membership_tier, subscription_status')
            .eq('id', user.id)
            .single();

          if (userError) {
            checks.auth = `⚠️ User authenticated but profile not found`;
            userData = { id: user.id, email: user.email };
          } else {
            checks.auth = '✅ User authenticated';
            userData = userRecord;
          }
        }
      } catch (error: any) {
        checks.auth = `❌ ${error.message}`;
        errors.push(`Auth check failed: ${error.message}`);
      }
    }

    // ========== 返回诊断结果 ==========
    const allChecksPassed = errors.length === 0;
    
    return res.status(allChecksPassed ? 200 : 500).json({
      status: allChecksPassed ? 'ok' : 'error',
      checks,
      envStatus,
      errors: errors.length > 0 ? errors : undefined,
      user: userData,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    });

  } catch (error: any) {
    console.error('Diagnostic test failed:', error);
    return res.status(500).json({
      status: 'error',
      checks,
      errors: [error.message],
      message: 'Unexpected error during diagnostic test'
    });
  }
}

