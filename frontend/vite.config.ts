import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * base — префикс URL для всех статических ресурсов в production.
 *
 * Для кастомного домена в корне (https://myfirstproject.su/) должно быть '/'.
 * Тогда в index.html попадут пути вида /assets/index-xxx.js (абсолютно от корня сайта).
 *
 * Если когда‑нибудь задеплоите приложение в подкаталог (например /app/),
 * задайте в Vercel переменную VITE_BASE_PATH=/app/ и пересоберите проект.
 */
function publicBase(): string {
  const fromEnv = process.env.VITE_BASE_PATH?.trim()
  if (!fromEnv || fromEnv === '/') {
    return '/'
  }
  const withLeading = fromEnv.startsWith('/') ? fromEnv : `/${fromEnv}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

/** Убирает crossorigin из production index.html: иначе module-скрипт грузится в «CORS-режиме»,
 *  и при цепочке CDN/провайдера иногда зависает в «Ожидание», тогда как CSS без того же механизма открывается. */
function stripCrossoriginFromHtml(): import('vite').Plugin {
  return {
    name: 'strip-crossorigin-html',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(?:=["'][^"']*["'])?/gi, '')
    },
  }
}

export default defineConfig({
  plugins: [react(), stripCrossoriginFromHtml()],
  base: publicBase(),
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // каталог относительно outDir (dist) — совпадает с дефолтом Vite
    assetsDir: 'assets',
    emptyOutDir: true,
    // корректные URL в source maps (удобно для отладки)
    sourcemap: false,
    rollupOptions: {
      output: {
        /** Несколько файлов вместо одного ~250 KiB — при обрыве соединения на крупном ответе проще «дожать» докачку. */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('node_modules/react-dom')) return 'vendor-react-dom'
          if (id.includes('node_modules/react-router')) return 'vendor-router'
          if (/node_modules[/\\]react[/\\]/.test(id)) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
