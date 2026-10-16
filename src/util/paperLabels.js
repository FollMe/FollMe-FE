// Labels for paper invitations (tem thiệp giấy): each invited guest's name
// to stick on the envelope, and a QR code to their personal link where they
// answer. Laid out on A4 label sheets.
import { hasPersonalLink } from './invitation';

/** A4 sheets with no margins, the cells filling the page. */
export const LAYOUTS = [
  { value: '3x7', cols: 3, rows: 7, label: 'Tem dán 3 × 7 (21 tem, 70 × 42 mm)' },
  { value: '2x4', cols: 2, rows: 4, label: 'Thẻ 2 × 4 (8 thẻ, 105 × 74 mm)' },
];

export const SUFFIXES = [
  { value: 'family', text: 'và gia đình', label: '… và gia đình' },
  { value: 'partner', text: 'và người thương', label: '… và người thương' },
  { value: 'plus', text: 'và bạn đồng hành', label: '… và bạn đồng hành' },
  { value: 'none', text: '', label: 'Chỉ tên khách' },
];

// A name that already says who comes with them
const ALREADY_PLURAL = /(gia đình|cả nhà|và |&|\+|vợ chồng|hai bác|ông bà|các bạn|cùng )/i;

/**
 * "Cô Năm và gia đình"; a name like "Anh Tuấn & chị Hà" stays as it is.
 * The added words keep together on one line (no-break spaces).
 */
export function addressee(name, suffix = 'family') {
  const trimmed = (name ?? '').trim();
  const text = SUFFIXES.find(s => s.value === suffix)?.text ?? '';
  if (!text || ALREADY_PLURAL.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} ${text.replace(/ /g, '\u00a0')}`;
}

/** Guests with a personal link, by group then name, filtered. */
export function labelGuests(guests = [], { group = '', unsentOnly = false } = {}) {
  return guests
    .filter(g => hasPersonalLink(g) && (!group || (g.group ?? '') === group) && (!unsentOnly || !g.sentAt))
    .sort((a, b) => (a.group ?? '').localeCompare(b.group ?? '', 'vi') || a.name.localeCompare(b.name, 'vi'));
}

/**
 * Pages of cells: `skip` empty cells first (labels already used on the
 * first sheet), then one per guest. A cell is a guest or null.
 */
export function labelPages(guests, layout, skip = 0) {
  if (!guests.length) {
    return [];
  }
  const perPage = layout.cols * layout.rows;
  const cells = [...Array(Math.max(0, Math.min(skip, perPage - 1))).fill(null), ...guests];
  const pages = [];
  for (let i = 0; i < cells.length; i += perPage) {
    const page = cells.slice(i, i + perPage);
    pages.push([...page, ...Array(perPage - page.length).fill(null)]);
  }
  return pages;
}

/** Smaller type for a long name, so it fits a 70 mm label on two lines. */
export function nameSize(text) {
  if (text.length > 44) {
    return 'xs';
  }
  if (text.length > 30) {
    return 's';
  }
  return 'm';
}
