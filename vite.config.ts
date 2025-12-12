import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      // Vite only exposes env vars with specific prefixes to the client bundle.
      // We support both VITE_* (Vite default) and NEXT_PUBLIC_* (common on Vercel/Next.js),
      // but we intentionally do NOT expose SUPABASE_* to avoid leaking service keys.
      envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
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
