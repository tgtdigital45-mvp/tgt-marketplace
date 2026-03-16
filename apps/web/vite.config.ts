import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');
  return {
    envDir: '../../',
    server: {
      port: 3001,
      strictPort: false,
      host: '0.0.0.0',
      headers: {
        // "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://*; connect-src 'self' http://localhost:* ws://localhost:* https://* wss://*;"
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt'],
        manifest: {
          name: 'CONTRATTO Marketplace',
          short_name: 'CONTRATTO',
          description: 'Marketplace de serviços profissionais',
          theme_color: '#0f172a',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'favicon.svg',
              sizes: '48x48 72x72 96x96 128x128 256x256 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.VITE_APP_TYPE': JSON.stringify('marketplace'),
      'globalThis.VITE_APP_TYPE': JSON.stringify('marketplace'),
      'globalThis.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''),
      'globalThis.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
      'globalThis.VITE_PORTAL_URL': JSON.stringify(env.VITE_PORTAL_URL),
      'globalThis.VITE_LANDING_URL': JSON.stringify(env.VITE_LANDING_URL),
      'globalThis.VITE_PRO_APP_URL': JSON.stringify(env.VITE_PRO_APP_URL),
      'globalThis.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@tgt/core': path.resolve(__dirname, '../../packages/core/src'),
        '@tgt/ui-web': path.resolve(__dirname, '../../packages/ui-web/src'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
    optimizeDeps: {
      force: true // Força limpar cache na próxima inicialização
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', '@headlessui/react', 'lucide-react'],
            ai: ['@google/genai'],
            maps: ['leaflet', 'react-leaflet']
          }
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
    }
  };
});
