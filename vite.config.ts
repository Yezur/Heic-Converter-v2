import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Heic-Converter-v2/',
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
        start_url: '/Heic-Converter-v2/',
        scope: '/Heic-Converter-v2/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/Heic-Converter-v2/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        navigateFallback: '/Heic-Converter-v2/index.html',
        globPatterns: ['**/*.{js,css,html,svg,wasm,worker.js}']
      }
    })
  ]
});
