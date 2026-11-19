// Scanning a guest's QR code at the reception desk: the code on their paper
// invitation label or on their phone is their personal link.

const PERSONAL_LINK = /\/invitations\/([a-f0-9]{24})(?:[/?#]|$)/i;

/** The guest id in a scanned personal link, or null for anything else. */
export function guestIdFromQr(text) {
  const match = String(text ?? '').trim().match(PERSONAL_LINK);
  return match ? match[1].toLowerCase() : null;
}

/** Whether this browser can open a camera at all. */
export function canScan() {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

/**
 * Reads QR codes from the back camera into `video`, calling `onCode(text)`
 * for each one seen (the same code again only after `repeatMs`). Resolves
 * to a stop function; rejects when there is no camera or no permission.
 */
export async function startScanner(video, onCode, { repeatMs = 3000, frameMs = 150 } = {}) {
  const [{ default: jsQR }, stream] = await Promise.all([
    import('jsqr'),
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }),
  ]);
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  video.muted = true;
  await video.play().catch(() => {});

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let stopped = false;
  let timer = null;
  let last = { text: null, at: 0 };

  function tick() {
    if (stopped) {
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w && h) {
      // Small frames decode fast enough on any phone
      const scale = Math.min(1, 640 / Math.max(w, h));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
      const now = Date.now();
      if (code?.data && (code.data !== last.text || now - last.at > repeatMs)) {
        last = { text: code.data, at: now };
        onCode(code.data);
      }
    }
    timer = setTimeout(tick, frameMs);
  }
  tick();

  return function stop() {
    stopped = true;
    clearTimeout(timer);
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  };
}
