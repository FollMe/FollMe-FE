// "Save the date" pictures to post on Zalo, Facebook or Instagram: drawn on a
// canvas in the invitation's colors, from the event, its cover photo and a
// QR code to the invitation. Pure drawing: the caller loads the images.
import dayjs from 'dayjs';
import { vnWallClock } from './date';

export const STORY_FORMATS = {
  story: { width: 1080, height: 1920, label: 'Story (dọc)' },
  square: { width: 1080, height: 1080, label: 'Vuông' },
};

export const STORY_PALETTES = {
  blush: { bg: ['#f8dfe5', '#fbeef0'], paper: '#fffaf9', ink: '#4a2730', muted: '#795963', accent: '#c45c74' },
  classic: { bg: ['#a3201e', '#7c1513'], paper: '#fffaf0', ink: '#5c1212', muted: '#8a5a3c', accent: '#a3201e' },
  minimal: { bg: ['#f3f2ef', '#e4e4e7'], paper: '#ffffff', ink: '#18181b', muted: '#63636b', accent: '#18181b' },
  night: { bg: ['#1e2a52', '#0b1026'], paper: '#111734', ink: '#f3ead7', muted: '#b9b1a0', accent: '#d9b66b' },
  garden: { bg: ['#dfe8d8', '#eef2ea'], paper: '#fbfcf8', ink: '#23362a', muted: '#56685b', accent: '#5f7f5f' },
};

const SERIF = "'Cormorant Garamond', 'Lora', Georgia, serif";
const SANS = "'Be Vietnam Pro', system-ui, sans-serif";
const WEEKDAYS = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];

/** The largest font size from `size` down that fits `text` in `maxWidth`. */
export function fitSize(ctx, text, maxWidth, size, font, min = 24) {
  let current = size;
  ctx.font = font(current);
  while (current > min && ctx.measureText(text).width > maxWidth) {
    current -= 2;
    ctx.font = font(current);
  }
  return current;
}

/** Words in lines no wider than `maxWidth`; past `maxLines` the last one ends in "…". */
export function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) {
    lines.push(line);
  }
  if (lines.length <= maxLines) {
    return lines;
  }
  const kept = lines.slice(0, maxLines);
  let last = `${kept[maxLines - 1]}…`;
  while (last.length > 1 && ctx.measureText(last).width > maxWidth) {
    last = `${last.slice(0, -2)}…`;
  }
  kept[maxLines - 1] = last;
  return kept;
}

/** "THỨ BẢY · 16.01.2027" and "11:00", in Vietnam. */
export function storyDate(startAt) {
  const at = vnWallClock(startAt);
  return { day: `${WEEKDAYS[at.getDay()]} · ${dayjs(at).format('DD.MM.YYYY')}`, time: dayjs(at).format('HH:mm') };
}

function spaced(ctx, text, x, y, spacing) {
  // letterSpacing where the browser has it (Chrome, Safari 17+), plain otherwise
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x + spacing / 2, y);
    ctx.letterSpacing = '0px';
  } else {
    ctx.fillText(text, x, y);
  }
}

/** A rectangle with a round top: the arch of the invitation's cover. */
function arch(ctx, x, y, w, h, bottomRadius = 24) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h - bottomRadius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - bottomRadius, y + h);
  ctx.lineTo(x + bottomRadius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bottomRadius);
  ctx.closePath();
}

/** Draws `img` to cover the box, centered (like object-fit: cover). */
function cover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

/**
 * Draws the picture. `couple` = [groom, bride] or null (then `title`);
 * `photo` and `qr` are loaded images or null. The parts are measured
 * first, then stacked down the paper: the photo shrinks when they do not
 * fit, and they sit a little above the middle when there is room to spare.
 */
export function drawStory(ctx, { format = 'story', theme = 'blush', couple, title, startAt, location, photo, qr, glyph = '囍' }) {
  const { width: W, height: H } = STORY_FORMATS[format];
  const p = STORY_PALETTES[theme] ?? STORY_PALETTES.blush;
  const isStory = format === 'story';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Background and the arched paper
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, p.bg[0]);
  bg.addColorStop(1, p.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const m = isStory ? 70 : 50;
  const top = isStory ? 110 : 50;
  const bottom = H - (isStory ? 110 : 50);
  arch(ctx, m, top, W - 2 * m, bottom - top, 28);
  ctx.fillStyle = p.paper;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = p.accent;
  ctx.stroke();
  arch(ctx, m + 16, top + 16, W - 2 * m - 32, bottom - top - 32, 18);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const cx = W / 2;
  const inner = W - 2 * m - 120;
  const text = (str, y, size, font, color) => {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(str, cx, y + size * 0.8);
  };

  // ---- Measure each part: [height, gap after, draw(top)] ----
  const parts = [];
  const kicker = isStory ? 34 : 28;
  parts.push([kicker, isStory ? 44 : 26, y => {
    ctx.fillStyle = p.accent;
    ctx.font = `600 ${kicker}px ${SANS}`;
    spaced(ctx, 'SAVE THE DATE', cx, y + kicker * 0.8, isStory ? 12 : 10);
  }]);

  // The photo in an arch (its height settled below), or the seal
  let photoH = photo && isStory ? 640 : 0;
  if (isStory) {
    parts.push(photo
      ? [() => photoH, 70, y => {
        const h = photoH;
        const w = h * 0.8;
        ctx.save();
        arch(ctx, cx - w / 2, y, w, h, 22);
        ctx.clip();
        cover(ctx, photo, cx - w / 2, y, w, h);
        ctx.restore();
        arch(ctx, cx - w / 2 - 10, y - 10, w + 20, h + 20, 28);
        ctx.lineWidth = 2;
        ctx.strokeStyle = p.accent;
        ctx.stroke();
      }]
      : [260, 70, y => {
        ctx.beginPath();
        ctx.arc(cx, y + 130, 130, 0, Math.PI * 2);
        ctx.fillStyle = p.accent;
        ctx.fill();
        ctx.fillStyle = p.paper;
        ctx.font = `600 140px ${SERIF}`;
        ctx.fillText(glyph, cx, y + 180);
      }]);
  }

  // Names on one line when they fit at a good size, else stacked
  const nameFont = s => `italic 600 ${s}px ${SERIF}`;
  if (couple) {
    const line = `${couple[0]} & ${couple[1]}`;
    const one = fitSize(ctx, line, inner, isStory ? 120 : 130, nameFont);
    if (one >= (isStory ? 88 : 64) || !isStory) {
      parts.push([one * 1.05, isStory ? 64 : 44, y => text(line, y, one, nameFont(one), p.ink)]);
    } else {
      const size = Math.min(fitSize(ctx, couple[0], inner, 120, nameFont), fitSize(ctx, couple[1], inner, 120, nameFont));
      parts.push([size * 2.7, 64, y => {
        text(couple[0], y, size, nameFont(size), p.ink);
        text('&', y + size * 1.02, size * 0.6, nameFont(size * 0.6), p.accent);
        text(couple[1], y + size * 1.65, size, nameFont(size), p.ink);
      }]);
    }
  } else {
    const size = fitSize(ctx, title, inner * 1.6, isStory ? 96 : 84, nameFont, 48);
    ctx.font = nameFont(size);
    const lines = wrapLines(ctx, title, inner, 2);
    parts.push([lines.length * size * 1.12, isStory ? 64 : 44, y => {
      lines.forEach((l, i) => text(l, y + i * size * 1.12, size, nameFont(size), p.ink));
    }]);
  }

  // Date, time and place
  const when = storyDate(startAt);
  const dateSize = isStory ? 40 : 36;
  parts.push([dateSize, 16, y => {
    ctx.fillStyle = p.accent;
    ctx.font = `600 ${dateSize}px ${SANS}`;
    spaced(ctx, when.day, cx, y + dateSize * 0.8, 6);
  }]);
  const timeSize = isStory ? 56 : 48;
  parts.push([timeSize, 24, y => text(when.time, y, timeSize, `600 ${timeSize}px ${SERIF}`, p.ink)]);
  const placeSize = isStory ? 32 : 28;
  ctx.font = `400 ${placeSize}px ${SANS}`;
  const place = wrapLines(ctx, location, inner, isStory ? 2 : 1);
  if (place.length) {
    parts.push([place.length * placeSize * 1.35, 56, y => {
      place.forEach((l, i) => text(l, y + i * placeSize * 1.35, placeSize, `400 ${placeSize}px ${SANS}`, p.muted));
    }]);
  }

  // The QR to the invitation
  if (qr) {
    const q = isStory ? 190 : 150;
    const label = isStory ? 28 : 22;
    parts.push([q + 28 + 18 + label, 0, y => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - q / 2 - 14, y, q + 28, q + 28);
      ctx.drawImage(qr, cx - q / 2, y + 14, q, q);
      text('Quét để xem thiệp', y + q + 28 + 18, label, `500 ${label}px ${SANS}`, p.muted);
    }]);
  }

  // ---- Fit them between the arch's top and the footer ----
  const start = top + (isStory ? 220 : 120);
  const end = bottom - (isStory ? 130 : 84);
  const heightOf = part => (typeof part[0] === 'function' ? part[0]() : part[0]);
  const total = () => parts.reduce((sum, part, i) => sum + heightOf(part) + (i < parts.length - 1 ? part[1] : 0), 0);
  if (photoH && total() > end - start) {
    photoH = Math.max(360, photoH - (total() - (end - start)));
  }
  let gapScale = 1;
  const fixed = parts.reduce((sum, part) => sum + heightOf(part), 0);
  const gaps = total() - fixed;
  if (total() > end - start && gaps > 0) {
    gapScale = Math.max(0.3, (end - start - fixed) / gaps);
  }
  const used = fixed + gaps * gapScale;
  let y = start + Math.max(0, (end - start - used) * 0.42);
  parts.forEach(([, gap, draw], i) => {
    draw(y);
    y += heightOf(parts[i]) + gap * gapScale;
  });

  ctx.fillStyle = p.muted;
  ctx.font = `400 ${isStory ? 24 : 20}px ${SANS}`;
  ctx.fillText('Thiệp mời online · FollMe', cx, bottom - (isStory ? 70 : 40));
}

/** "save-the-date-minh-lan.png" */
export function storyFilename(names, format) {
  const slug = names
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `save-the-date${slug ? `-${slug}` : ''}${format === 'square' ? '-vuong' : ''}.png`;
}
