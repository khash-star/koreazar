import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Make main CSS non-blocking so LCP isn't delayed (Lighthouse: render-blocking)
function nonBlockingCss() {
  return {
    name: 'non-blocking-css',
    transformIndexHtml(html) {
      return html.replace(
        /<link(\s[^>]*?)rel="stylesheet"([^>]*?)href="([^"]*assets[^"]+\.css)"([^>]*)>/gi,
        (_m, a, b, href, c) => {
          const attrs = (a + b + c).trim();
          return `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"${attrs ? ' ' + attrs : ''}><noscript><link rel="stylesheet" href="${href}"${attrs ? ' ' + attrs : ''}></noscript>`;
        }
      );
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nonBlockingCss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Koreazar - Солонгост буй Монголчуудын зарын сайт',
        short_name: 'Koreazar',
        description: 'Солонгост амьдарч буй Монголчуудын хувьд зориулсан зарын сайт.',
        theme_color: '#ea580c',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/sw\.js$/, /^\/workbox-.*\.js$/],
      },
    }),
  ],
  build: {
    sourcemap: false, // Production: do not serve sourcemaps (Lighthouse "savings" / security)
    minify: 'esbuild', // Minify JS (Lighthouse: Reduce unused JS / payload)
  },
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}) 