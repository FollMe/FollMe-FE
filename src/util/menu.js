// The party's menu (thực đơn): the dishes in serving order, on the card
// around the day and on printed cards for each table.

export const MAX_MENU_ITEMS = 15;
export const MAX_MENU_ITEM = 80;

/** A usual Vietnamese wedding menu, to start from and adjust. */
export const SUGGESTED_MENU = [
  'Gỏi ngó sen tôm thịt',
  'Súp cua gà xé',
  'Tôm sú hấp nước dừa',
  'Gà ta hấp lá chanh',
  'Bò nướng tiêu xanh',
  'Lẩu hải sản',
  'Cơm chiên Dương Châu',
  'Chè hạt sen long nhãn',
];

// Shown on the card from the day before to the end of the party
const OPENS_BEFORE_MS = 24 * 60 * 60 * 1000;
const CLOSES_AFTER_MS = 8 * 60 * 60 * 1000;

/** Whether the card shows the menu now. */
export function menuOpen(startAt, now = Date.now()) {
  const start = new Date(startAt).getTime();
  return now >= start - OPENS_BEFORE_MS && now <= start + CLOSES_AFTER_MS;
}

let nextId = 0;
/** Form rows with React ids. */
export function toMenuRows(menu = []) {
  return menu.map(dish => ({ dish, id: `m${nextId++}` }));
}

/** What is saved: one line per dish, no empty ones. */
export function tidyMenu(rows = []) {
  return rows.map(row => (row.dish ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}
