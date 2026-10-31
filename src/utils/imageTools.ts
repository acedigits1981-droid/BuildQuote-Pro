import { JobSitePhoto, estimateDataUrlSizeKb } from './calculators';

const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.72;

/**
 * Proportionally scales any image element or canvas to max 900px width/height
 * and compresses it via canvas.toDataURL('image/jpeg', 0.72).
 */
export function compressSourceToJpeg(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  sourceWidth: number,
  sourceHeight: number
): { dataUrl: string; sizeKb: number } {
  let targetW = sourceWidth || 640;
  let targetH = sourceHeight || 420;

  if (targetW > MAX_DIMENSION || targetH > MAX_DIMENSION) {
    if (targetW >= targetH) {
      targetH = Math.round((targetH * MAX_DIMENSION) / targetW);
      targetW = MAX_DIMENSION;
    } else {
      targetW = Math.round((targetW * MAX_DIMENSION) / targetH);
      targetH = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', sizeKb: 0 };
  }

  // Fill background in case source has transparency
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(source, 0, 0, targetW, targetH);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return {
    dataUrl,
    sizeKb: estimateDataUrlSizeKb(dataUrl),
  };
}

/**
 * Loads a raw Data URL or File into an Image, scales proportionally to max 900px,
 * and compresses to JPEG (0.72 quality).
 */
export function compressDataUrlToJpeg(
  rawDataUrl: string
): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const result = compressSourceToJpeg(
        img,
        img.naturalWidth || img.width || 640,
        img.naturalHeight || img.height || 420
      );
      resolve(result);
    };
    img.onerror = () => {
      resolve({
        dataUrl: rawDataUrl,
        sizeKb: estimateDataUrlSizeKb(rawDataUrl),
      });
    };
    img.src = rawDataUrl;
  });
}

/**
 * Generates a realistic simulated job-site inspection photo compressed via JPEG 0.72.
 */
export function generateSimulatedSitePhotoJpeg(captionText: string): {
  dataUrl: string;
  sizeKb: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 520;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: '', sizeKb: 0 };

  // Architectural site background
  const grad = ctx.createLinearGradient(0, 0, 0, 520);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(0.62, '#334155');
  grad.addColorStop(0.62, '#475569');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 520);

  // Subtle perspective grid lines (slab / room layout)
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(100, 80, 600, 300);

  ctx.beginPath();
  for (let x = 175; x < 700; x += 75) {
    ctx.moveTo(x, 80);
    ctx.lineTo(x, 380);
  }
  for (let y = 140; y < 380; y += 60) {
    ctx.moveTo(100, y);
    ctx.lineTo(700, y);
  }
  ctx.stroke();

  // Dimension callout banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(32, 412, 736, 80);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 412, 736, 80);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('JOB SITE PHOTO VERIFIED · BUILDQUOTE PRO', 52, 444);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '16px sans-serif';
  ctx.fillText(captionText || 'Primary Room / Slab Area - Pre-Work Site Photo', 52, 472);

  return compressSourceToJpeg(canvas, canvas.width, canvas.height);
}

/**
 * 1-Tap Photo Export: Downloads the compressed/annotated job site photo
 * with its caption and timestamp burned into a clean bottom bar as a JPEG file.
 */
export function downloadJobSitePhotoJpeg(photo: JobSitePhoto): void {
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth || img.width || 800;
    const h = img.naturalHeight || img.height || 520;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, w, h);

    // Stamp caption + timestamp footer bar at bottom of exported JPEG
    const barHeight = Math.max(44, Math.round(h * 0.1));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.fillRect(0, h - barHeight, w, barHeight);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.max(13, Math.round(barHeight * 0.36))}px sans-serif`;
    ctx.fillText(photo.caption || 'Job Site Photo', 16, h - Math.round(barHeight * 0.48));

    ctx.fillStyle = '#fbbf24';
    ctx.font = `${Math.max(11, Math.round(barHeight * 0.28))}px monospace`;
    ctx.fillText(
      `${photo.timestamp} · BuildQuote Pro (${photo.sizeKb} KB)`,
      16,
      h - Math.round(barHeight * 0.16)
    );

    const exportDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const link = document.createElement('a');
    const safeName = (photo.caption || 'job-site-photo')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.download = `${safeName || 'job-site-photo'}.jpg`;
    link.href = exportDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.src = photo.dataUrl;
}
