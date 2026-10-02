import { filterGuests } from './GuestList';
import { reminderQueue, summarizeGuests } from 'util/invitation';

const guests = [
  { _id: '1', name: 'Cô Ba', source: 'host', sentAt: '2026-10-01', viewed: 2, rsvp: { status: 'attending', count: 2 } },
  { _id: '2', name: 'Anh Tuấn & người thương', source: 'host', viewed: 0 },
  { _id: '3', name: 'Đức Huy', source: 'public', viewed: 1, rsvp: { status: 'declined', count: 0 } },
  { _id: '4', name: 'Chú Tư', source: 'host', sentAt: '2026-10-01', viewed: 0, rsvp: { status: 'maybe', count: 1 } },
];
const ids = list => list.map(g => g._id);

describe('filterGuests', () => {
  it('filters by status', () => {
    expect(ids(filterGuests(guests, 'unsent', ''))).toEqual(['2']);
    expect(ids(filterGuests(guests, 'pending', ''))).toEqual(['2']);
    expect(ids(filterGuests(guests, 'attending', ''))).toEqual(['1']);
    expect(ids(filterGuests(guests, 'declined', ''))).toEqual(['3']);
    expect(ids(filterGuests(guests, 'all', ''))).toEqual(['1', '2', '3', '4']);
  });

  it('finds names typed without accents', () => {
    expect(ids(filterGuests(guests, 'all', 'tuan'))).toEqual(['2']);
    expect(ids(filterGuests(guests, 'all', 'duc'))).toEqual(['3']);
    expect(ids(filterGuests(guests, 'unsent', 'co ba'))).toEqual([]);
  });
});

describe('summarizeGuests', () => {
  it('counts sent, opened, answers and headcount', () => {
    expect(summarizeGuests(guests)).toEqual({
      invited: 4, sent: 2, opened: 2, attending: 1, maybe: 1, declined: 1, pending: 1, headcount: 2,
    });
  });
});

describe('isGoneError', () => {
  const { isGoneError } = require('util/invitation');
  const api = status => Object.assign(new Error('x'), { name: 'SERVER_ERROR', status });

  it('is only a link that is wrong or gone', () => {
    expect(isGoneError(api(404))).toBe(true);
    expect(isGoneError(api(400))).toBe(true);
    expect(isGoneError(api(500))).toBe(false);
    expect(isGoneError(api(429))).toBe(false);
    expect(isGoneError(new TypeError('Failed to fetch'))).toBe(false);
  });
});

describe('reminderQueue', () => {
  const now = new Date('2026-10-10T12:00:00Z').getTime();
  const hoursAgo = h => new Date(now - h * 3600 * 1000).toISOString();
  const list = [
    { _id: 'a', name: 'Reminded 2 days ago', sentAt: hoursAgo(96), remindedAt: hoursAgo(48) },
    { _id: 'b', name: 'Sent 3 days ago', sentAt: hoursAgo(72) },
    { _id: 'c', name: 'Sent an hour ago', sentAt: hoursAgo(1) },
    { _id: 'd', name: 'Reminded an hour ago', sentAt: hoursAgo(72), remindedAt: hoursAgo(1) },
    { _id: 'e', name: 'Answered', sentAt: hoursAgo(72), rsvp: { status: 'attending' } },
    { _id: 'f', name: 'Not sent' },
    { _id: 'g', name: 'Public', source: 'public', sentAt: hoursAgo(72) },
  ];

  it('nudges who got their link a day ago, never reminded first', () => {
    expect(ids(reminderQueue(list, now))).toEqual(['b', 'a']);
  });

  it('waits a day after sending or reminding', () => {
    expect(ids(reminderQueue(list, now - 47 * 3600 * 1000))).toEqual(['b']);
  });
});
