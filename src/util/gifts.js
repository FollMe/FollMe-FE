// The gift ledger (sổ mừng): what each guest gave, written down by the host
// after the party, the way families keep it in a notebook.
import { matchScore } from './search';

export const MAX_GIFT_AMOUNT = 10_000_000_000;
export const MAX_GIFT_NOTE = 100;
export const QUICK_AMOUNTS = [200_000, 300_000, 500_000, 1_000_000, 2_000_000];
export const QUICK_NOTES = ['Chuyển khoản', 'Vàng', 'Quà'];

const UNITS = {
  k: 1e3, nghin: 1e3, ngan: 1e3, ng: 1e3,
  tr: 1e6, trieu: 1e6, m: 1e6, cu: 1e6,
};

/**
 * The amount in VND from what the host types: "500k", "500 nghìn",
 * "1tr2" (1.200.000), "1,5 triệu", "2.000.000đ"... A bare number under
 * 10.000 means thousands ("500" is 500.000 đ): nobody gives 500 đồng.
 * null when it cannot be read.
 */
export function parseAmount(text) {
  const clean = String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, '')
    .replace(/(vnd|dong|d|₫)$/, '');
  const match = clean.match(/^(\d+(?:[.,]\d+)*)([a-z]+)?(\d{1,3})?$/);
  if (!match) {
    return null;
  }
  const [, number, unitName, tail] = match;
  const unit = unitName ? UNITS[unitName] : 1;
  if (!unit || (tail && !unitName)) {
    return null;
  }
  let value;
  if (/^\d{1,3}([.,]\d{3})+$/.test(number)) {
    // 500.000 or 1,000,000: thousands separators
    value = Number(number.replace(/[.,]/g, ''));
  } else if (/^\d+[.,]\d{1,2}$/.test(number) && unitName) {
    // 1,5tr or 1.25tr
    value = Number(number.replace(',', '.'));
  } else if (/^\d+$/.test(number)) {
    value = Number(number);
  } else {
    return null;
  }
  let amount = value * unit;
  if (tail) {
    // 1tr2 = 1.2 million, 2tr500 = 2.5 million, 1k5 = 1.500
    amount += Number(tail) * (unit / 10 ** tail.length);
  }
  if (!unitName && amount < 10_000) {
    amount *= 1000;
  }
  amount = Math.round(amount);
  return amount > 0 && amount <= MAX_GIFT_AMOUNT ? amount : null;
}

/** 1200000 -> "1.200.000 đ" */
export function formatVnd(amount) {
  return `${String(Math.round(amount ?? 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;
}

/** 500000 -> "500k", 1200000 -> "1,2tr": for buttons. */
export function shortVnd(amount) {
  if (amount >= 1e6) {
    return `${String(Math.round(amount / 1e5) / 10).replace('.', ',')}tr`;
  }
  return `${Math.round(amount / 1e3)}k`;
}

/** Totals of the ledger, overall and per group (groups in first-seen order, none last). */
export function giftSummary(guests) {
  const summary = { count: 0, total: 0, notes: 0, groups: [] };
  const groups = new Map();
  for (const guest of guests) {
    if (!guest.gift) {
      continue;
    }
    const amount = guest.gift.amount || 0;
    summary.count += 1;
    summary.total += amount;
    if (!amount) {
      summary.notes += 1;
    }
    const key = guest.group || '';
    const row = groups.get(key) ?? { group: key, count: 0, total: 0 };
    row.count += 1;
    row.total += amount;
    groups.set(key, row);
  }
  summary.groups = [...groups.values()].sort((a, b) => (a.group === '') - (b.group === ''));
  return summary;
}

export const LEDGER_TABS = [
  ['todo', 'Chưa ghi', g => !g.gift],
  ['done', 'Đã ghi', g => Boolean(g.gift)],
  ['all', 'Tất cả', () => true],
];

/**
 * The guests to show. A search looks through everyone, best match first.
 * "Chưa ghi" puts guests who came first (their envelopes are in the box);
 * "Đã ghi" shows the latest entries first, to check what was just written.
 */
export function ledgerGuests(guests, { tab = 'todo', query = '', group = null } = {}) {
  const inGroup = g => group === null || (g.group || '') === group;
  if (query.trim()) {
    return guests
      .filter(inGroup)
      .map(guest => ({ guest, score: matchScore(query, guest.name) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.guest);
  }
  const test = LEDGER_TABS.find(([key]) => key === tab)?.[2] ?? (() => true);
  const list = guests.filter(g => inGroup(g) && test(g));
  if (tab === 'todo') {
    return [...list.filter(g => g.arrivedAt), ...list.filter(g => !g.arrivedAt)];
  }
  if (tab === 'done') {
    return [...list].sort((a, b) => new Date(b.gift.at) - new Date(a.gift.at));
  }
  return list;
}

/** The ledger as spreadsheet rows, with the total last. */
export function ledgerRows(guests, formatTime) {
  const given = guests.filter(g => g.gift);
  const summary = giftSummary(given);
  return [
    ['Tên', 'Nhóm', 'Số tiền', 'Ghi chú', 'Đã đến tiệc', 'Ghi lúc'],
    ...given.map(g => [
      g.name,
      g.group ?? '',
      g.gift.amount || '',
      g.gift.note ?? '',
      g.arrivedAt ? `Có${(g.arrivedCount || 1) > 1 ? `, ${g.arrivedCount} người` : ''}` : '',
      formatTime(g.gift.at),
    ]),
    ['Tổng', `${summary.count} người mừng`, summary.total, '', '', ''],
  ];
}
