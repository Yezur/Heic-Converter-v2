# HEIC/HEIF + iPhone Converter (Offline)

An offline-first, 100% client-side converter for HEIC/HEIF photos and iPhone videos. Drag & drop your files, convert them locally in your browser, and download individual outputs or a ZIP archive. Nothing is uploaded to a server.

**Website:** https://yezur.github.io/Heic-Converter-v2/

---

# User Manual (for everyone, including non-technical users)

This guide explains how to use the converter, what to expect, and how to fix common issues—without any technical jargon.

## What this app does

* Converts **HEIC/HEIF photos** (common on iPhones) into more shareable formats.
* Converts **iPhone videos** into more common formats.
* Works **entirely in your browser**—your files **never leave your device**.
* Can run **offline** after the first successful load.

## Before you start

1. Use a modern browser (Chrome, Edge, Firefox, or Safari).
2. Make sure you can access the app page at least once with the internet (so it can store the offline files).

## Quick start (most common use)

1. Open the app in your browser.
2. **Drag and drop** your HEIC/HEIF photos or iPhone videos into the page.  
   *You can also click to choose files if you prefer.*
3. Wait for the files to appear in the list.
4. Click **Convert**.
5. When the conversion finishes, click **Download**.  
   *If you converted multiple files, you can download all at once as a ZIP file.*

That’s it!

---

## Detailed step-by-step (non-technical)

### 1. Open the converter
Go to the app link in your browser. If you don’t have it bookmarked, ask whoever shared it with you.

### 2. Add your files
You have two easy options:

* **Drag and drop:**  
  Open a folder on your computer, grab the files with your mouse, and drop them onto the converter window.
* **Click and choose:**  
  Click the file area, pick your photos/videos, and press **Open**.

### 3. Start converting
Press **Convert**. A progress indicator will show as each file is processed.

### 4. Download your results
After conversion:
* Click **Download** for a single file.
* Click **Download ZIP** to get everything in one bundle.

---

## Supported files

### Photos
* **HEIC**
* **HEIF**

### Videos
* iPhone video formats (such as MOV)

If a file does not appear in the list, it may not be supported or may be corrupted.

---

## Offline use (no internet needed)

After your first successful visit:
1. You can disconnect from the internet.
2. Open the app again.
3. It will continue working offline.

If the app doesn’t load offline, reconnect once to refresh it.

---

## Privacy and safety

* Your files **never leave your computer**.
* There is **no upload** to any server.
* Everything happens in your browser.

---

## Troubleshooting (common problems)

### “My file won’t convert”
* Make sure it’s a HEIC/HEIF photo or iPhone video.
* Try converting one file at a time.
* Restart the browser and try again.

### “The app is slow”
* Large videos take time and use a lot of memory.
* Close other tabs or apps to free up memory.

### “Nothing happens when I click Convert”
* Wait a moment—large files can take a few seconds to start.
* Try using a different browser (Chrome or Edge are often fastest).

### “I can’t download the ZIP”
* Some browsers block large downloads.
* Try downloading files one-by-one.

### “It won’t work offline”
* Open the app once while connected to the internet.
* Then try again offline.

---

## Tips for best results

* Convert smaller batches if you have many large files.
* Keep your browser updated.
* For very large videos, try converting them one at a time.

---

# Advanced info (for technical users or maintainers)

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
