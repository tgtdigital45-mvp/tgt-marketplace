import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env from monorepo root (same as web-marketplace)
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');
  return {
    envDir: '../../',
    server: {
      port: 3002,
      strictPort: false,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.VITE_APP_TYPE': JSON.stringify('pro'),
      'globalThis.VITE_APP_TYPE': JSON.stringify('pro'),
      'globalThis.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'globalThis.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'globalThis.VITE_PORTAL_URL': JSON.stringify(env.VITE_PORTAL_URL),
      'globalThis.VITE_LANDING_URL': JSON.stringify(env.VITE_LANDING_URL),
      'globalThis.VITE_PRO_APP_URL': JSON.stringify(env.VITE_PRO_APP_URL),
    },
    resolve: {
      // @/ resolves to apps/web/src so all existing component imports work unchanged.
      // web-pro only renders pro/admin routes — client-only code is never imported
      // and therefore never bundled (tree-shaken out at build time).
      alias: {
        '@': path.resolve(__dirname, '../web/src'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
    optimizeDeps: {
      exclude: ['@tgt/shared'],
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', '@headlessui/react', 'lucide-react'],
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
