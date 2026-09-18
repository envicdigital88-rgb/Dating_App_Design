/**
 * Client-side photo pipeline: centre-crops to a 3:4 portrait, downscales for
 * mobile and desktop delivery, and compresses to JPEG before upload.
 */
export async function processPhoto(
file: File,
{ maxWidth = 1080, quality = 0.82, cropToProfile = true }: {maxWidth?: number;quality?: number; cropToProfile?: boolean} = {})
: Promise<string> {
  const dataUrl = await readFile(file);
  const image = await loadImage(dataUrl);

  let sx = 0, sy = 0, sw = image.width, sh = image.height;
  let targetRatio = image.width / image.height;

  if (cropToProfile) {
    targetRatio = 3 / 4;
    const sourceRatio = image.width / image.height;
    if (sourceRatio > targetRatio) {
      sw = image.height * targetRatio;
      sx = (image.width - sw) / 2;
    } else {
      sh = image.width / targetRatio;
      sy = (image.height - sh) / 2;
    }
  }

  const width = Math.min(maxWidth, sw);
  const height = width / targetRatio;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Basic automated moderation gate before a photo reaches the review queue. */
export function screenPhoto(file: File): {ok: boolean;error?: string;} {
  if (!file.type.startsWith('image/')) return { ok: false, error: 'That file is not an image.' };
  if (file.size > 12 * 1024 * 1024) return { ok: false, error: 'Photos must be under 12MB.' };
  return { ok: true };
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

export async function getCroppedImg(imageSrc: string, pixelCrop: { x: number, y: number, width: number, height: number }): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return imageSrc;
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not open that image.'));
    img.src = src;
  });
}