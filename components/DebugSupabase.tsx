/**
 * Supabase连接诊断组件
 * 用于测试Supabase配置是否正确
 */

import React, { useState } from 'react';
import { supabase } from '../config/supabase';

export const DebugSupabase: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const tests: any = {
      timestamp: new Date().toISOString(),
      envVars: {
        SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '❌ 未配置',
        SUPABASE_KEY_EXISTS: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        SUPABASE_KEY_LENGTH: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      },
    };

    // 测试1: 检查环境变量
    if (!import.meta.env.VITE_SUPABASE_URL) {
      tests.envVarsStatus = '❌ 失败: VITE_SUPABASE_URL 未配置';
    } else if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      tests.envVarsStatus = '❌ 失败: VITE_SUPABASE_ANON_KEY 未配置';
    } else {
      tests.envVarsStatus = '✅ 环境变量已配置';
    }

    // 测试2: 测试Supabase连接
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        tests.connectionStatus = `❌ 连接失败: ${error.message}`;
        tests.connectionError = error;
      } else {
        tests.connectionStatus = '✅ Supabase连接成功';
      }
    } catch (err: any) {
      tests.connectionStatus = `❌ 连接异常: ${err.message}`;
      tests.connectionError = err;
    }

    // 测试3: 检查auth状态
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        tests.authStatus = `⚠️ Auth检查失败: ${error.message}`;
      } else {
        tests.authStatus = session ? '✅ 已登录' : '⚪ 未登录（正常）';
      }
    } catch (err: any) {
      tests.authStatus = `❌ Auth异常: ${err.message}`;
    }

    setResult(tests);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors font-mono text-sm"
      >
        {loading ? '测试中...' : '🔍 诊断Supabase'}
      </button>

      {result && (
        <div className="mt-2 p-4 bg-white rounded-lg shadow-xl max-w-2xl max-h-96 overflow-auto border-2 border-red-500">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Supabase 诊断结果</h3>
            <button onClick={() => setResult(null)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="mt-3 text-sm space-y-1">
            <div>环境变量: {result.envVarsStatus}</div>
            <div>数据库连接: {result.connectionStatus}</div>
            <div>认证状态: {result.authStatus}</div>
          </div>
        </div>
      )}
    </div>
  );
};

