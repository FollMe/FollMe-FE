const UPLOAD_PATH = '/image/upload/';

/**
 * A Cloudinary photo with a transformation applied, e.g.
 * `cldUrl(url, 'w_800,c_limit')` for a smaller copy. Other URLs (and
 * local files in samples) are returned as they are.
 */
export function cldUrl(url, transform) {
  if (!url || !transform || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD_PATH)) {
    return url;
  }
  return url.replace(UPLOAD_PATH, `${UPLOAD_PATH}${transform},q_auto,f_auto/`);
}

/** Width and height that fit `maxEdge` on the longer side. */
export function fitWithin(width, height, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      // Applies the EXIF rotation of phone photos
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (err) {
      // Fall back to an <img> below
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/jpeg', quality);
  });
}

/**
 * Shrinks a photo from the phone (often 4000px and 5MB) to a JPEG under
 * `maxBytes`: quicker to upload on 4G and under the gateway's body limit.
 * Throws if the browser cannot read the file (e.g. HEIC on Chrome).
 */
export async function shrinkPhoto(file, { maxEdge = 2000, maxBytes = 950 * 1024 } = {}) {
  const image = await decode(file);
  let size = fitWithin(image.width, image.height, maxEdge);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = size.width;
    canvas.height = size.height;
    // White under transparent PNGs, which JPEG cannot keep
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(image, 0, 0, size.width, size.height);
    const blob = await toBlob(canvas, attempt === 0 ? 0.86 : 0.8);
    if (blob.size <= maxBytes) {
      image.close?.();
      return { blob, ...size };
    }
    size = fitWithin(size.width, size.height, Math.max(size.width, size.height) * 0.8);
  }
  image.close?.();
  throw new Error('Photo too large');
}
