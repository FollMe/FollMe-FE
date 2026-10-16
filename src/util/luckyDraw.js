// "Quay số may mắn" at the party: draw names from who came, who wrote a
// wish, the tables, lucky numbers or a typed list, fairly, and remember the
// winners on this device so a reload loses nothing.
import { compareTables, seatingPlan, tableLabel } from './seating';

export const POOLS = [
  { value: 'arrived', label: 'Khách đã đến (đón khách)' },
  { value: 'attending', label: 'Khách nhận lời tham dự' },
  { value: 'wishes', label: 'Người gửi lời chúc' },
  { value: 'tables', label: 'Các bàn tiệc' },
  { value: 'numbers', label: 'Số may mắn (1 đến N)' },
  { value: 'custom', label: 'Danh sách tự nhập' },
];

export const MAX_NUMBER = 9999;

const fold = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/\s+/g, ' ').trim();

function guestEntry(guest) {
  const note = [guest.table && tableLabel(guest.table), guest.group].filter(Boolean).join(' · ');
  return { id: `g:${guest._id}`, name: guest.name, note };
}

/**
 * Who can win, for a pool: [{ id, name, note }]. `numbers` is how many lucky
 * numbers were handed out, `custom` the typed list, one per line.
 */
export function poolEntries(event, pool, { numbers = 100, custom = '' } = {}) {
  const guests = event?.guests ?? [];
  switch (pool) {
    case 'arrived':
      return guests.filter(g => g.arrivedAt).map(guestEntry);
    case 'attending':
      return guests.filter(g => g.arrivedAt || g.rsvp?.status === 'attending').map(guestEntry);
    case 'wishes': {
      const seen = new Map();
      for (const wish of event?.wishes ?? []) {
        const name = (wish.name ?? '').trim();
        if (name && !wish.isHidden && !seen.has(fold(name))) {
          seen.set(fold(name), { id: `w:${fold(name)}`, name, note: 'Đã gửi lời chúc' });
        }
      }
      return [...seen.values()];
    }
    case 'tables':
      return seatingPlan(guests, event?.seatsPerTable).tables
        .sort((a, b) => compareTables(a.table, b.table))
        .map(row => ({ id: `t:${row.table}`, name: tableLabel(row.table), note: `${row.people} người` }));
    case 'numbers': {
      const n = Math.min(MAX_NUMBER, Math.max(0, Math.floor(Number(numbers) || 0)));
      return Array.from({ length: n }, (_, i) => ({ id: `n:${i + 1}`, name: String(i + 1), note: '' }));
    }
    case 'custom': {
      const seen = new Set();
      return custom.split('\n').map(line => line.trim()).filter(line => {
        const key = fold(line);
        if (!line || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      }).map(line => ({ id: `c:${fold(line)}`, name: line, note: '' }));
    }
    default:
      return [];
  }
}

/** A uniform random integer in [0, n), from the browser's secure source when there is one. */
export function secureIndex(n, random = defaultRandom) {
  if (n <= 1) {
    return 0;
  }
  // Reject the top values that would favor small indexes
  const limit = Math.floor(0x100000000 / n) * n;
  let value;
  do {
    value = random();
  } while (value >= limit);
  return value % n;
}

function defaultRandom() {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    return cryptoObj.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 0x100000000);
}

/** One winner among those who have not won yet (when `once`), or null. */
export function drawWinner(entries, winners = [], { once = true, random } = {}) {
  const taken = new Set(winners.map(w => w.id));
  const left = once ? entries.filter(e => !taken.has(e.id)) : entries;
  if (!left.length) {
    return null;
  }
  return left[secureIndex(left.length, random)];
}

/**
 * The names flashing by before the winner lands: `steps` picks, never the
 * same twice in a row, ending on the winner; and how long each stays (ms),
 * slowing down towards the end.
 */
export function reel(entries, winner, steps = 28, random) {
  const names = [];
  for (let i = 0; i < steps - 1; i++) {
    let pick = entries[secureIndex(entries.length, random)];
    if (entries.length > 1 && pick.id === names[names.length - 1]?.id) {
      pick = entries[(entries.indexOf(pick) + 1) % entries.length];
    }
    names.push(pick);
  }
  names.push(winner);
  const delays = names.map((_, i) => Math.round(45 + 520 * (i / (steps - 1)) ** 3));
  return { names, delays };
}

const storageKey = eventId => `luckyDraw:${eventId}`;

export function loadWinners(eventId) {
  try {
    const list = JSON.parse(localStorage.getItem(storageKey(eventId)) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

export function saveWinners(eventId, winners) {
  try {
    if (winners.length) {
      localStorage.setItem(storageKey(eventId), JSON.stringify(winners));
    } else {
      localStorage.removeItem(storageKey(eventId));
    }
  } catch (err) {
    // Private mode: the list lives as long as the page
  }
}
