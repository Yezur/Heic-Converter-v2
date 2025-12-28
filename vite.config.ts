import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const baseUrl = process.env.VITE_BASE_URL ?? '/';

export default defineConfig({
  base: baseUrl,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: [
        'icons/icon.svg',
        'ffmpeg/*',
        'heif/*'
      ],
      manifest: {
        name: 'HEIC/HEIF + iPhone Converter',
        short_name: 'HEIC Converter',
        description: 'Offline HEIC/HEIF photo and iPhone video converter that runs entirely in your browser.',
        start_url: baseUrl,
        scope: baseUrl,
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          {
            src: `${baseUrl}icons/icon.svg`,
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        navigateFallback: `${baseUrl}index.html`,
        globPatterns: ['**/*.{js,css,html,svg,wasm,worker.js}']
      }
    })
  ]
});
