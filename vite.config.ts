import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Vite 只会在浏览器端暴露 VITE_* 环境变量。
    // 但我们在 Vercel 上通常配置的是 NEXT_PUBLIC_*（Next.js 习惯）。
    // 这里做一个兼容映射：把 NEXT_PUBLIC_SUPABASE_* 注入为 import.meta.env.VITE_SUPABASE_*，
    // 以避免生产环境前端拿不到 Supabase 配置导致白屏。
    const resolvedSupabaseUrl =
      env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
    const resolvedSupabaseAnonKey =
      env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        target: 'esnext',
        chunkSizeWarningLimit: 1000,
      },
      plugins: [react()],
      define: {
        // Inject Supabase vars for browser bundle (Vite client)
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(resolvedSupabaseUrl),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(resolvedSupabaseAnonKey),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: [
          {
            find: /^@\//,
            replacement: `${path.resolve(__dirname, '.')}/`,
          },
        ],
      }
    };
});
