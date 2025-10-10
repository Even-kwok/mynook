import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Record<string, string> = {};
  const errors: string[] = [];

  try {
    // ========== 检查 1: API 基础响应 ==========
    checks.api = '✅ API responding';

    // ========== 检查 2: 环境变量 ==========
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_KEY',
      'CREEM_API_KEY',
      'CREEM_WEBHOOK_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      checks.env = `❌ Missing: ${missingVars.join(', ')}`;
      errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
    } else {
      checks.env = '✅ All env vars present';
    }

    // ========== 检查 3: Supabase 连接 ==========
    let supabaseClient;
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not found');
      }

      supabaseClient = createClient(supabaseUrl, supabaseKey);
      
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

