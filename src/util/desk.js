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

/**
 * The polled list, except guests with a change still on its way: those keep
 * what this phone shows until the server answers.
 */
export function mergeDesk(local, server, inFlight) {
  if (!inFlight.size) {
    return server;
  }
  const mine = new Map(local.map(g => [g._id, g]));
  return server.map(g => (inFlight.has(g._id) && mine.has(g._id) ? mine.get(g._id) : g));
}
