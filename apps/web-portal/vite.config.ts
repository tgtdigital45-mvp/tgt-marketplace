import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');
  return {
    envDir: '../../',
    server: {
      port: 3004,
      strictPort: false,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.VITE_APP_TYPE': JSON.stringify('portal'),
      'globalThis.__VITE_ENV__': JSON.stringify(env),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../web/src'),
        '@portal': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
    optimizeDeps: {
      exclude: ['@tgt/shared'],
    },
    build: {
      outDir: 'dist',
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
