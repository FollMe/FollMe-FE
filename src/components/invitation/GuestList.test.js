import { filterGuests } from './GuestList';
import { groupSummary, reminderQueue, summarizeGuests, thankQueue } from 'util/invitation';

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
      arrived: 0, arrivedPeople: 0, gifts: 0, giftTotal: 0,
    });
  });

  it('counts who came; a walk-in is never waited on for an answer', () => {
    const party = [
      { ...guests[0], arrivedAt: '2027-01-16T04:05:00Z', arrivedCount: 3 },
      guests[1],
      { _id: '5', name: 'Bác Năm', source: 'desk', viewed: 0, arrivedAt: '2027-01-16T04:10:00Z' },
    ];
    expect(summarizeGuests(party)).toMatchObject({ invited: 3, pending: 1, arrived: 2, arrivedPeople: 4 });
  });
});

describe('walk-ins and arrivals in the host list', () => {
  const party = [
    ...guests,
    { _id: '5', name: 'Bác Năm', source: 'desk', viewed: 0, arrivedAt: '2027-01-16T04:10:00Z', arrivedCount: 2 },
    { ...guests[0], _id: '6', arrivedAt: '2027-01-16T04:05:00Z', arrivedCount: 1 },
  ];

  it('has nothing to send or remind for a walk-in', () => {
    expect(ids(filterGuests(party, 'unsent', ''))).toEqual(['2']);
    expect(ids(filterGuests(party, 'pending', ''))).toEqual(['2']);
    expect(ids(filterGuests(party, 'arrived', ''))).toEqual(['5', '6']);
    const { hasPersonalLink } = require('util/invitation');
    expect(party.filter(hasPersonalLink).map(g => g._id)).toEqual(['1', '2', '4', '6']);
  });

  it('counts arrivals per group', () => {
    const rows = groupSummary([
      { _id: 'a', group: 'Nhà trai', arrivedAt: 'x', arrivedCount: 3 },
      { _id: 'b', group: 'Nhà trai' },
      { _id: 'c', source: 'desk', arrivedAt: 'x' },
    ]);
    expect(rows.map(r => [r.group, r.arrived, r.arrivedPeople, r.pending])).toEqual([['Nhà trai', 1, 3, 2], ['', 1, 1, 0]]);
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

describe('groups', () => {
  const list = [
    { _id: '1', name: 'Cô Ba', group: 'Nhà trai', rsvp: { status: 'attending', count: 2 } },
    { _id: '2', name: 'Chị Lan', group: 'Nhà gái' },
    { _id: '3', name: 'Đức Huy', source: 'public', rsvp: { status: 'attending', count: 1 } },
    { _id: '4', name: 'Chú Tư', group: 'Nhà trai', rsvp: { status: 'declined', count: 0 } },
  ];

  it('filters by group, "" for guests without one', () => {
    expect(ids(filterGuests(list, 'all', '', 'Nhà trai'))).toEqual(['1', '4']);
    expect(ids(filterGuests(list, 'all', '', ''))).toEqual(['3']);
    expect(ids(filterGuests(list, 'attending', '', 'Nhà trai'))).toEqual(['1']);
    expect(ids(filterGuests(list, 'all', '', null))).toEqual(['1', '2', '3', '4']);
  });

  it('sums up each group, guests without one last', () => {
    expect(groupSummary(list).map(r => [r.group, r.invited, r.invited - r.pending, r.headcount])).toEqual([
      ['Nhà trai', 2, 2, 2],
      ['Nhà gái', 1, 0, 0],
      ['', 1, 1, 1],
    ]);
  });
});

describe('thankQueue', () => {
  it('thanks who came, said they would or sent a gift, once, by personal link', () => {
    const party = [
      { _id: 'a', source: 'host', arrivedAt: 'x' },
      { _id: 'b', source: 'host', rsvp: { status: 'attending', count: 2 } },
      { _id: 'c', source: 'host', gift: { amount: 500000 } },
      { _id: 'd', source: 'host', rsvp: { status: 'declined', count: 0 } },
      { _id: 'e', source: 'host', arrivedAt: 'x', thankedAt: 'y' },
      { _id: 'f', source: 'desk', arrivedAt: 'x' },
      { _id: 'g', source: 'public', rsvp: { status: 'attending', count: 1 } },
      { _id: 'h', source: 'ledger', gift: { amount: 1 } },
      { _id: 'i' },
    ];
    expect(ids(thankQueue(party))).toEqual(['a', 'b', 'c']);
  });
});
