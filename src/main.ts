import './styles.css';
import { createZip } from './zip';

const dropzone = document.getElementById('dropzone') as HTMLDivElement;
const filePicker = document.getElementById('filePicker') as HTMLInputElement;
const qualityInput = document.getElementById('quality') as HTMLInputElement;
const qualityValue = document.getElementById('qualityValue') as HTMLSpanElement;
const presetSelect = document.getElementById('preset') as HTMLSelectElement;
const queueList = document.getElementById('queueList') as HTMLDivElement;
const queueStatus = document.getElementById('queueStatus') as HTMLParagraphElement;
const downloadAllButton = document.getElementById('downloadAll') as HTMLButtonElement;
const clearAllButton = document.getElementById('clearAll') as HTMLButtonElement;
const startConvertButton = document.getElementById('startConvert') as HTMLButtonElement;

qualityValue.textContent = qualityInput.value;
qualityInput.addEventListener('input', () => {
  qualityValue.textContent = qualityInput.value;
});

type QueueStatus = 'queued' | 'running' | 'done' | 'error' | 'canceled';

type QueueItem = {
  id: string;
  file: File;
  kind: 'image' | 'video';
  status: QueueStatus;
  progress: number;
  message?: string;
  outputBlob?: Blob;
  outputName?: string;
};

const queue: QueueItem[] = [];
let isProcessing = false;
let currentItemId: string | null = null;
let ffmpegInstance: any = null;
let ffmpegLoading: Promise<any> | null = null;
let heifModule: any = null;
let heifLoading: Promise<any> | null = null;
let fallbackIdCounter = 0;

const baseUrl = import.meta.env.BASE_URL || '/';

const updateQueueStatus = () => {
  if (queue.length === 0) {
    queueStatus.textContent = 'No files yet.';
    return;
  }
  const active = queue.filter((item) => item.status === 'queued' || item.status === 'running');
  queueStatus.textContent = `${queue.length} file(s) in queue · ${active.length} pending`;
};

const renderQueue = () => {
  queueList.innerHTML = '';
  for (const item of queue) {
    const row = document.createElement('div');
    row.className = 'queue-item';
    const title = document.createElement('div');
    title.innerHTML = `<h3>${item.file.name}</h3><small>${item.kind.toUpperCase()} · ${(item.file.size / 1024 / 1024).toFixed(2)} MB</small>`;

    const progress = document.createElement('div');
    progress.className = 'progress';
    const progressBar = document.createElement('span');
    progressBar.style.width = `${item.progress}%`;
    progress.appendChild(progressBar);

    const status = document.createElement('div');
    status.className = 'status';
    status.textContent = item.message ? `${item.status} · ${item.message}` : item.status;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const downloadButton = document.createElement('button');
    downloadButton.className = 'button secondary';
    downloadButton.textContent = 'Download';
    downloadButton.disabled = !item.outputBlob;
    downloadButton.addEventListener('click', () => {
      if (!item.outputBlob || !item.outputName) return;
      downloadBlob(item.outputBlob, item.outputName);
    });

    const retryButton = document.createElement('button');
    retryButton.className = 'button secondary';
    retryButton.textContent = 'Retry';
    retryButton.disabled = item.status === 'running' || item.status === 'queued';
    retryButton.addEventListener('click', () => retryItem(item.id));

    const cancelButton = document.createElement('button');
    cancelButton.className = 'button secondary';
    cancelButton.textContent = item.status === 'running' ? 'Cancel' : 'Remove';
    cancelButton.addEventListener('click', () => removeItem(item.id));

    actions.appendChild(downloadButton);
    actions.appendChild(retryButton);
    actions.appendChild(cancelButton);

    row.appendChild(title);
    row.appendChild(progress);
    row.appendChild(status);
    row.appendChild(actions);

    queueList.appendChild(row);
  }
  updateQueueStatus();
  const hasQueued = queue.some((item) => item.status === 'queued');
  const hasReady = queue.some((item) => item.outputBlob && item.outputName);
  startConvertButton.disabled = isProcessing || !hasQueued;
  startConvertButton.textContent = isProcessing ? 'Converting…' : 'Start conversion';
  downloadAllButton.disabled = !hasReady;
};

const generateQueueId = () => {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const toHex = (value: number) => value.toString(16).padStart(2, '0');
      const parts = Array.from(bytes, toHex).join('');
      return `${parts.slice(0, 8)}-${parts.slice(8, 12)}-${parts.slice(12, 16)}-${parts.slice(
        16,
        20
      )}-${parts.slice(20)}`;
    }
  }
  fallbackIdCounter = (fallbackIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}`;
};

const addFiles = (files: FileList | File[]) => {
  const list = Array.from(files);
  for (const file of list) {
    const ext = file.name.toLowerCase();
    const kind = ext.endsWith('.heic') || ext.endsWith('.heif') ? 'image' : 'video';
    queue.push({
      id: generateQueueId(),
      file,
      kind,
      status: 'queued',
      progress: 0
    });
  }
  renderQueue();
};

const removeItem = (id: string) => {
  const index = queue.findIndex((item) => item.id === id);
  if (index === -1) return;
  const item = queue[index];
  if (item.status === 'running') {
    item.status = 'canceled';
    item.message = 'Canceled';
    item.progress = 0;
    if (item.kind === 'video' && ffmpegInstance) {
      ffmpegInstance.exit();
      ffmpegInstance = null;
      ffmpegLoading = null;
    }
    isProcessing = false;
    currentItemId = null;
  } else {
    queue.splice(index, 1);
  }
  renderQueue();
  processQueue();
};

const retryItem = (id: string) => {
  const item = queue.find((entry) => entry.id === id);
  if (!item) return;
  item.status = 'queued';
  item.progress = 0;
  item.message = undefined;
  item.outputBlob = undefined;
  item.outputName = undefined;
  renderQueue();
  processQueue();
};

const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const downloadAll = async () => {
  const ready = queue.filter((item) => item.outputBlob && item.outputName);
  if (ready.length === 0) {
    queueStatus.textContent =
      queue.length === 0 ? 'No files yet.' : 'No completed files to download yet.';
    return;
  }
  const entries = await Promise.all(
    ready.map(async (item) => ({
      name: item.outputName as string,
      data: new Uint8Array(await (item.outputBlob as Blob).arrayBuffer())
    }))
  );
  const zipData = createZip(entries);
  downloadBlob(new Blob([zipData], { type: 'application/zip' }), 'converted-files.zip');
};

const clearAll = () => {
  queue.splice(0, queue.length);
  isProcessing = false;
  currentItemId = null;
  renderQueue();
};

const loadHeif = async () => {
  if (heifModule) return heifModule;
  if (!heifLoading) {
    heifLoading = import(/* @vite-ignore */ `${baseUrl}heif/libheif.js`).then((mod: any) => {
      const factory = mod.default ?? mod;
      if (typeof factory === 'function') {
        return factory({
          locateFile: (file: string) => `${baseUrl}heif/${file}`
        });
      }
      return factory;
    });
  }
  heifModule = await heifLoading;
  return heifModule;
};

const loadFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;
  if (!ffmpegLoading) {
    ffmpegLoading = import(/* @vite-ignore */ `${baseUrl}ffmpeg/ffmpeg.min.js`).then((mod: any) => {
      const create = mod.createFFmpeg || mod.default?.createFFmpeg || mod.default;
      const fetchFile = mod.fetchFile || mod.default?.fetchFile;
      if (!create) {
        throw new Error('ffmpeg.wasm failed to load.');
      }
      const instance = create({
        log: true,
        corePath: `${baseUrl}ffmpeg/ffmpeg-core.js`
      });
      instance.fetchFile = fetchFile;
      return instance;
    });
  }
  ffmpegInstance = await ffmpegLoading;
  return ffmpegInstance;
};

const processQueue = async () => {
  if (isProcessing) return;
  const next = queue.find((item) => item.status === 'queued');
  if (!next) return;
  isProcessing = true;
  currentItemId = next.id;
  next.status = 'running';
  next.message = undefined;
  next.progress = 0;
  renderQueue();

  try {
    if (next.kind === 'image') {
      await convertImage(next);
    } else {
      await convertVideo(next);
    }
    if (next.status !== 'canceled') {
      next.status = 'done';
      next.progress = 100;
    }
  } catch (error: any) {
    if (next.status !== 'canceled') {
      next.status = 'error';
      next.message = error?.message || 'Conversion failed';
    }
  } finally {
    isProcessing = false;
    currentItemId = null;
    renderQueue();
    processQueue();
  }
};

const convertImage = async (item: QueueItem) => {
  const buffer = await item.file.arrayBuffer();
  const libheif = await loadHeif();
  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(new Uint8Array(buffer));
  if (!images || images.length === 0) {
    throw new Error('Unable to decode HEIC/HEIF file');
  }
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();
  const orientation = image.get_orientation ? image.get_orientation() : 1;
  const rgb = new Uint8ClampedArray(width * height * 4);
  image.display({ data: rgb, width, height });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  const oriented = applyOrientation(canvas, ctx, rgb, width, height, orientation);
  item.progress = 85;
  renderQueue();

  const quality = Number(qualityInput.value);
  const blob = await new Promise<Blob>((resolve, reject) => {
    oriented.canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Failed to encode JPEG'));
          return;
        }
        resolve(result);
      },
      'image/jpeg',
      quality
    );
  });

  item.outputBlob = blob;
  item.outputName = item.file.name.replace(/\.(heic|heif)$/i, '.jpg');
};

const convertVideo = async (item: QueueItem) => {
  const ffmpeg = await loadFFmpeg();
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const { fetchFile } = ffmpeg;
  const inputName = `input-${item.id}.${item.file.name.split('.').pop() || 'mov'}`;
  const outputName = `output-${item.id}.mp4`;

  ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
    item.progress = Math.min(99, Math.round(ratio * 100));
    item.message = 'Transcoding';
    renderQueue();
  });

  ffmpeg.FS('writeFile', inputName, await fetchFile(item.file));

  const preset = presetSelect.value;
  const presetArgs =
    preset === 'fast'
      ? ['-preset', 'ultrafast', '-crf', '28']
      : preset === 'hq'
        ? ['-preset', 'slow', '-crf', '18']
        : ['-preset', 'veryfast', '-crf', '23'];

  await ffmpeg.run(
    '-i',
    inputName,
    '-c:v',
    'libx264',
    ...presetArgs,
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    outputName
  );

  const data = ffmpeg.FS('readFile', outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  item.outputBlob = blob;
  item.outputName = item.file.name.replace(/\.(mov|mp4)$/i, '.mp4');

  ffmpeg.FS('unlink', inputName);
  ffmpeg.FS('unlink', outputName);
  ffmpeg.FS('readdir', '/').forEach((entry: string) => {
    if (entry !== '.' && entry !== '..') {
      try {
        ffmpeg.FS('unlink', entry);
      } catch {
        // ignore
      }
    }
  });
};

const applyOrientation = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  orientation: number
) => {
  const imageData = new ImageData(data, width, height);

  if (orientation > 4) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  switch (orientation) {
    case 2:
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      break;
    case 7:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      break;
    case 8:
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      break;
    default:
      break;
  }

  ctx.putImageData(imageData, 0, 0);
  return { canvas };
};

const setupDropzone = () => {
  const stop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      stop(event as DragEvent);
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      stop(event as DragEvent);
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', (event) => {
    const dt = (event as DragEvent).dataTransfer;
    if (dt?.files) addFiles(dt.files);
  });
};

filePicker.addEventListener('change', () => {
  if (filePicker.files) addFiles(filePicker.files);
  filePicker.value = '';
});

clearAllButton.addEventListener('click', clearAll);

downloadAllButton.addEventListener('click', downloadAll);

startConvertButton.addEventListener('click', () => {
  processQueue();
});

setupDropzone();
renderQueue();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${baseUrl}sw.js`)
      .catch(() => undefined);
  });
}
