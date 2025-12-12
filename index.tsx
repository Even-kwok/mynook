
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import FigmaHomePrototype from './components/FigmaHomePrototype';
import { AuthProvider } from './context/AuthContext';
import { isSupabaseConfigured, missingSupabaseEnvVars } from './config/supabase';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple conditional mount for prototype route without adding router dependency
const isProtoRoute = (() => {
  const { pathname, hash } = window.location;
  return pathname === '/proto' || hash === '#/proto' || hash === '#proto';
})();

root.render(
  <React.StrictMode>
    {!isSupabaseConfigured ? (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Supabase 未配置，应用无法启动</h2>
        <p style={{ marginBottom: 12 }}>
          当前部署缺少前端必须的环境变量，所以会出现“白屏”。
        </p>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>缺少的变量</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {missingSupabaseEnvVars.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>怎么修复（Vercel）</div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>打开 Vercel 项目 → Settings → Environment Variables</li>
            <li>为 <b>Preview</b>（以及 Production，如果需要）添加：</li>
            <li>
              <code>VITE_SUPABASE_URL</code>（Supabase Project URL）
            </li>
            <li>
              <code>VITE_SUPABASE_ANON_KEY</code>（Supabase anon key）
            </li>
            <li>保存后重新部署（Redeploy）让 Vite 把变量打进前端构建产物</li>
          </ol>
        </div>
      </div>
    ) : (
      <AuthProvider>
        {isProtoRoute ? <FigmaHomePrototype /> : <App />}
      </AuthProvider>
    )}
  </React.StrictMode>
);
