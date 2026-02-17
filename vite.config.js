import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
  plugins: [react(), nonBlockingCss()],
  build: {
    sourcemap: false, // Production: do not serve sourcemaps (Lighthouse "savings" / security)
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