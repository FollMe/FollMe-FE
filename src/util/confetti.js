// A short burst of hearts and gold flakes over the page, for happy moments
// (the date revealed, "I'm coming"). Draws on a temporary canvas and
// removes it when done. Skipped for people who prefer reduced motion.

const DEFAULT_COLORS = ['#e8a3b0', '#d9b66b', '#f6e3b4', '#c45c74', '#ffffff'];

function heart(ctx, size) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.6);
  ctx.bezierCurveTo(-s * 1.2, -s * 0.2, -s * 0.5, -s * 1.1, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.5, -s * 1.1, s * 1.2, -s * 0.2, 0, s * 0.6);
  ctx.fill();
}

/**
 * @param {{ x?: number, y?: number, colors?: string[], count?: number }} [opts]
 *   x, y: origin in viewport pixels (defaults to the middle of the screen)
 */
export function burst(opts = {}) {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const { colors = DEFAULT_COLORS, count = 90 } = opts;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const x0 = opts.x ?? width / 2;
  const y0 = opts.y ?? height / 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '60',
  });
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    return {
      x: x0,
      y: y0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: 6 + Math.random() * 9,
      spin: (Math.random() - 0.5) * 0.3,
      angle: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)],
      isHeart: Math.random() < 0.45,
    };
  });

  const started = performance.now();
  const DURATION = 2600;
  function frame(now) {
    const t = now - started;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = Math.max(0, 1 - t / DURATION);
    for (const p of particles) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      if (p.isHeart) {
        heart(ctx, p.size);
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (t < DURATION) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}
