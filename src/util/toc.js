import { normalizeText } from './search';

function slugify(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'muc';
}

/**
 * Gives every h1-h3 of an article an id and lists them for a table of
 * contents.
 *
 * @param {string} html
 * @returns {{ html: string, headings: Array<{ id: string, text: string, level: number }> }}
 */
export function buildToc(html = '') {
  if (!html || typeof DOMParser === 'undefined') {
    return { html, headings: [] };
  }
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const used = {};
  const headings = [];
  root.querySelectorAll('h1, h2, h3').forEach(el => {
    const text = el.textContent.trim();
    if (!text) {
      return;
    }
    const base = slugify(text);
    used[base] = (used[base] ?? 0) + 1;
    const id = used[base] > 1 ? `${base}-${used[base]}` : base;
    el.id = id;
    headings.push({ id, text, level: Number(el.tagName[1]) });
  });

  // Indent relative to the biggest heading actually used.
  const minLevel = Math.min(...headings.map(h => h.level));
  headings.forEach(h => {
    h.level = h.level - minLevel + 1;
  });

  return { html: root.innerHTML, headings };
}
