import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '豆饼投资研究工作室',
        short_name: '豆饼投研',
        description: 'A local-first A-share and ETF research workspace.',
        theme_color: '#f7f3ea',
        background_color: '#f7f3ea',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff2}'],
        navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 5173
  }
});
