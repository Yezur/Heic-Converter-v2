# HEIC/HEIF + iPhone Converter (Offline)

An offline-first, 100% client-side converter for HEIC/HEIF photos and iPhone videos. Drag & drop your files, convert them locally in your browser, and download individual outputs or a ZIP archive. Nothing is uploaded to a server.

## Local development

```bash
npm install
npm run dev
```

## GitHub Pages deployment

This repo uses GitHub Actions to build and deploy the `dist/` folder to GitHub Pages on every push to `main`.

* Workflow: `.github/workflows/deploy.yml`
* Vite base path: `/Heic-Converter-v2/`
* Pages URL: `https://yezur.github.io/Heic-Converter-v2/`

## Offline support (PWA)

The app is a Progressive Web App (PWA). After the first load, assets are precached so the converter works offline. The service worker caches all JS/CSS plus WASM/worker assets stored in `public/ffmpeg` and `public/heif`.

## WASM assets (required)

This project expects the ffmpeg.wasm and libheif WASM binaries to be committed under:

```
public/ffmpeg/
public/heif/
```

These files must be the official binaries (e.g. from `@ffmpeg/core` and `libheif-js`). The placeholders in this repository are stubs and **must be replaced** with real WASM/worker assets for conversions to work.

## Limitations

* Large videos may hit browser RAM limits, especially on mobile devices.
* Video conversions run one at a time to reduce memory pressure.
* Performance depends heavily on CPU and available memory.
