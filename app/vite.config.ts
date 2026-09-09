import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2020',
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('@tanstack')) return 'query'
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-dom') || id.includes('react/')) return 'react'
            if (id.includes('purify')) return 'purify'
            return 'vendor'
          }
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'backgroud-capela-640.webp', 'backgroud-capela-800.webp', 'backgroud-capela-1122.webp', 'backgroud-capela.jpg'],
      manifest: {
        name: 'Rifa Borromeu 2026',
        short_name: 'Borromeu',
        description: 'Gestao de rifa - cartelas de 20 numeros',
        theme_color: '#0E1E3A',
        background_color: '#F7F2E6',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'icons.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ['**/*.{js,css,html,svg,webp,jpg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
