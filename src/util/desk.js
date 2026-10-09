// The reception desk at the party: whoever welcomes guests finds them by
// name and checks them in, with how many people came.
import { matchScore } from './search';

export const MAX_PARTY = 20;

/** People expected with this guest: what they answered, else one. */
export function partySize(guest) {
  const { status, count } = guest.rsvp ?? {};
  return (status === 'attending' || status === 'maybe') && count > 0 ? Math.min(count, MAX_PARTY) : 1;
}

/** What the desk knows about a guest before they arrive. */
export function rsvpHint(guest) {
  if (guest.source === 'desk') {
    return 'Thêm tại tiệc';
  }
  const { status, count } = guest.rsvp ?? {};
  if (status === 'attending') {
    return count > 1 ? `Báo đến · ${count} người` : 'Báo đến';
  }
  if (status === 'maybe') {
    return 'Chưa chắc đến';
  }
  if (status === 'declined') {
    return 'Báo không đến';
  }
  return 'Chưa trả lời';
}

export const DESK_TABS = [
  ['waiting', 'Chưa đến', g => !g.arrivedAt],
  ['arrived', 'Đã đến', g => Boolean(g.arrivedAt)],
  ['all', 'Tất cả', () => true],
];

/**
 * The guests to show. A search looks through everyone, arrived or not, best
 * match first: a guest checked in by another helper must not look missing.
 * Without one, the tab applies, but guests in `keep` (just checked in here)
 * stay in view so their headcount can still be fixed.
 */
export function deskGuests(guests, { tab = 'waiting', query = '', group = null, keep = new Set() } = {}) {
  const inGroup = g => group === null || (g.group || '') === group;
  if (query.trim()) {
    return guests
      .filter(inGroup)
      .map(guest => ({ guest, score: matchScore(query, guest.name) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.guest);
  }
  const test = DESK_TABS.find(([key]) => key === tab)?.[2] ?? (() => true);
  return guests.filter(g => inGroup(g) && (test(g) || keep.has(g._id)));
}

/** The counters at the top of the desk. */
export function deskSummary(guests) {
  const summary = { guests: guests.length, arrived: 0, people: 0, expected: 0 };
  for (const guest of guests) {
    if (guest.arrivedAt) {
      summary.arrived += 1;
      summary.people += guest.arrivedCount || 1;
    }
    if (guest.rsvp?.status === 'attending') {
      summary.expected += guest.rsvp.count || 1;
    }
  }
  return summary;
}

// Check-ins made at the desk wait here until the server has them: a
// party hall's basement often has no signal. One entry per guest, the
// latest change wins: { [guestId]: { arrived, count, at } }.
const pendingKey = eventId => `follme.desk.${eventId}.pending`;
const cacheKey = eventId => `follme.desk.${eventId}.list`;

export function loadPending(eventId) {
  try {
    return JSON.parse(localStorage.getItem(pendingKey(eventId))) ?? {};
  } catch (err) {
    return {};
  }
}

export function savePending(eventId, pending) {
  try {
    if (Object.keys(pending).length) {
      localStorage.setItem(pendingKey(eventId), JSON.stringify(pending));
    } else {
      localStorage.removeItem(pendingKey(eventId));
    }
  } catch (err) {
    // Kept in memory only
  }
}

/** The last list this phone saw, to keep working when it cannot load. */
export function loadCachedDesk(eventId) {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(eventId)));
  } catch (err) {
    return null;
  }
}

export function cacheDesk(eventId, data) {
  try {
    localStorage.setItem(cacheKey(eventId), JSON.stringify(data));
  } catch (err) {
    // Full or blocked: nothing to fall back on next time
  }
}

/** The list as this phone has it: the server's, with changes still waiting on top. */
export function applyPending(guests, pending) {
  return guests.map(guest => {
    const op = pending[guest._id];
    if (!op) {
      return guest;
    }
    if (!op.arrived) {
      const { arrivedAt, arrivedCount, ...rest } = guest;
      return rest;
    }
    const next = { ...guest, arrivedAt: guest.arrivedAt ?? op.at, arrivedCount: op.count ?? guest.arrivedCount };
    if (op.table !== undefined) {
      const { table, ...rest } = next;
      return op.table ? { ...rest, table: op.table } : rest;
    }
    return next;
  });
}

/**
 * Tables that can still seat `need` people, the guest's group's first:
 * where to send someone the plan did not expect. `plan` is seatingPlan().
 */
export function tablesWithRoom(plan, need, group = '') {
  const fits = plan.tables.filter(t => t.free >= need);
  return [...fits.filter(t => group && t.group === group), ...fits.filter(t => !group || t.group !== group)];
}
