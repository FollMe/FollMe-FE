import { filterGuests } from './GuestList';
import { summarizeGuests } from 'util/invitation';

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
