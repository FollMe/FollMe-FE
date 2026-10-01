import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './ScratchReveal.module.scss';

const FOILS = {
  gold: { stops: ['#a87a26', '#f3dc94', '#c99a3e', '#f7e7b0', '#b8892f'], ink: '#5a3d0c' },
  rose: { stops: ['#b8786f', '#f6d5cf', '#d9a39b', '#fbe4df', '#c98f8a'], ink: '#5a2a2f' },
  silver: { stops: ['#8d8d92', '#e9e9ec', '#b4b4b8', '#f4f4f6', '#9a9a9e'], ink: '#2b2b2e' },
};

// Share of the foil that must be scratched off before it all falls away.
const REVEAL_AT = 0.45;
const BRUSH = 30;

/** Paints the foil: a metallic gradient, glitter and the instruction. */
function paintFoil(canvas, width, height, foil, label) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { stops, ink } = FOILS[foil] ?? FOILS.gold;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  stops.forEach((color, i) => gradient.addColorStop(i / (stops.length - 1), color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Glitter
  for (let i = 0; i < (width * height) / 70; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
  }
  // Fine diagonal brushing, like real foil
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let x = -height; x < width; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = Math.max(12, Math.min(16, height * 0.24));
  ctx.font = `600 ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
  ctx.fillText(`✦  ${label}  ✦`, width / 2, height / 2);
}

function clearedShare(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) {
    return 0;
  }
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let clear = 0;
  let total = 0;
  // Every 8th pixel is plenty to estimate
  for (let i = 3; i < data.length; i += 32) {
    total++;
    if (data[i] === 0) {
      clear++;
    }
  }
  return total ? clear / total : 0;
}

/**
 * Hides its children under a scratch-off foil, like a lottery ticket.
 * Scratch with a finger or the mouse; Enter or Space reveals at once.
 * Screen readers read the children as usual.
 */
export default function ScratchReveal({ children, label, foil = 'gold', onReveal, className }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const last = useRef(null);
  const strokes = useRef(0);
  const revealed = useRef(false);
  const [state, setState] = useState('covered'); // covered | scratching | revealed

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) {
      return undefined;
    }
    // Layout size, not getBoundingClientRect: the cover is still scaling in
    // while this runs
    const paint = () => paintFoil(canvas, canvas.offsetWidth, canvas.offsetHeight, foil, label);
    paint();
    // Fonts arriving or a rotation change the size: repaint while untouched
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => strokes.current === 0 && paint())
      : null;
    observer?.observe(wrap);
    return () => observer?.disconnect();
  }, [foil, label]);

  const reveal = useCallback(() => {
    if (revealed.current) {
      return;
    }
    revealed.current = true;
    setState('revealed');
    const rect = wrapRef.current?.getBoundingClientRect();
    onReveal?.(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : {});
  }, [onReveal]);

  function scratchTo(e) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    // CSS pixels to bitmap pixels, from the current size: the canvas may have
    // been stretched since it was painted
    ctx.setTransform(canvas.width / rect.width, 0, 0, canvas.height / rect.height, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = BRUSH;
    ctx.beginPath();
    const from = last.current ?? point;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x + 0.01, point.y);
    ctx.stroke();
    last.current = point;
    strokes.current++;
    if (strokes.current % 6 === 0 && clearedShare(canvas) >= REVEAL_AT) {
      reveal();
    }
  }

  return (
    <div
      ref={wrapRef}
      className={clsx(styles.wrap, styles[state], className)}
      role={state === 'revealed' ? undefined : 'button'}
      tabIndex={state === 'revealed' ? undefined : 0}
      aria-label={state === 'revealed' ? undefined : `${label}. Nhấn Enter để xem ngay`}
      onKeyDown={e => {
        if (state !== 'revealed' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          reveal();
        }
      }}
    >
      {children}
      <canvas
        ref={canvasRef}
        className={styles.foil}
        aria-hidden="true"
        onPointerDown={e => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          last.current = null;
          setState(s => (s === 'covered' ? 'scratching' : s));
          scratchTo(e);
        }}
        onPointerMove={e => {
          if (e.buttons || e.pointerType === 'touch') {
            scratchTo(e);
          }
        }}
        onPointerUp={() => {
          last.current = null;
          if (canvasRef.current && clearedShare(canvasRef.current) >= REVEAL_AT) {
            reveal();
          }
        }}
      />
      <span className={styles.sheen} aria-hidden="true" />
    </div>
  );
}
