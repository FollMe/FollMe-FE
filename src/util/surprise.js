// "Hộp quà bí mật": a birthday surprise someone opens with a password only
// they would know, then picks one gift; the owner sees what they picked.
import { request } from './request';

export const MIN_GIFTS = 2;
export const MAX_GIFTS = 6;
export const MAX_NAME = 40;
export const MAX_MESSAGE = 1500;
export const MAX_HINT = 120;
export const MIN_PASSWORD = 3;
export const MAX_PASSWORD = 60;
export const MAX_GIFT_TITLE = 60;
export const MAX_GIFT_NOTE = 200;
export const MAX_PICK_NOTE = 200;

/** The mascots, each with its name as she meets it. */
export const MASCOTS = [
  { key: 'bear', label: 'Gấu Bông', hello: 'Gấu' },
  { key: 'bunny', label: 'Thỏ Mochi', hello: 'Thỏ' },
  { key: 'cat', label: 'Mèo Mứt', hello: 'Mèo' },
];
export const mascotOf = key => MASCOTS.find(m => m.key === key) ?? MASCOTS[0];

/** Gift ideas a tap away. */
export const GIFT_IDEAS = [
  { emoji: '🧸', title: 'Gấu bông khổng lồ' },
  { emoji: '💐', title: 'Bó hoa thật to' },
  { emoji: '👗', title: 'Một chiếc váy mới' },
  { emoji: '🌸', title: 'Nước hoa em thích' },
  { emoji: '👜', title: 'Túi xách xinh' },
  { emoji: '💄', title: 'Bộ son môi' },
  { emoji: '🏔️', title: 'Chuyến đi Đà Lạt' },
  { emoji: '🍝', title: 'Bữa tối lãng mạn' },
  { emoji: '🎤', title: 'Vé concert' },
  { emoji: '⌚', title: 'Đồng hồ đôi' },
  { emoji: '📷', title: 'Máy ảnh xinh' },
  { emoji: '🎮', title: 'Máy chơi game' },
];

export const surpriseApi = {
  list: () => request.get('api/surprises'),
  get: (id, opts) => request.get(`api/surprises/${id}`, opts),
  create: payload => request.post('api/surprises', payload),
  update: (id, payload) => request.put(`api/surprises/${id}`, payload),
  reopen: id => request.put(`api/surprises/${id}/reopen`),
  remove: id => request.del(`api/surprises/${id}`),
  publicView: id => request.get(`api/surprises/${id}/public`, { quiet: true }),
  // Quiet: the mascot says what went wrong
  unlock: (id, password) => request.postJson(`api/surprises/${id}/unlock`, { password }, { quiet: true }),
  pick: (id, payload) => request.postJson(`api/surprises/${id}/pick`, payload, { quiet: true }),
};

export function surpriseUrl(id) {
  return `${window.location.origin}/qua/${id}`;
}

/** "còn 2 ngày 3 giờ" until it opens, or null once it is open. */
export function untilOpen(opensAt, now = Date.now()) {
  const ms = new Date(opensAt).getTime() - now;
  if (!opensAt || !(ms > 0)) {
    return null;
  }
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

const passwordKey = id => `follme.surprise.${id}`;

/** The password of this tab's open box, so a reload does not ask again. */
export function rememberPassword(id, password) {
  try {
    sessionStorage.setItem(passwordKey(id), password);
  } catch (err) {
    // This visit only
  }
}

export function recallPassword(id) {
  try {
    return sessionStorage.getItem(passwordKey(id));
  } catch (err) {
    return null;
  }
}

let nextId = 0;
/** Form rows for the gifts, each with a React id. */
export function toGiftRows(gifts = []) {
  return gifts.map(g => ({ _id: g._id, emoji: g.emoji ?? '', title: g.title ?? '', note: g.note ?? '', id: `g${nextId++}` }));
}

export function newGiftRow(idea = {}) {
  return { emoji: idea.emoji ?? '🎁', title: idea.title ?? '', note: '', id: `g${nextId++}` };
}

/** What is saved: named gifts, one line each. */
export function tidyGiftRows(rows = []) {
  const line = v => (v ?? '').replace(/\s+/g, ' ').trim();
  return rows
    .filter(r => line(r.title))
    .map(r => ({ ...(r._id ? { _id: r._id } : {}), title: line(r.title), note: line(r.note), emoji: line(r.emoji) }));
}
