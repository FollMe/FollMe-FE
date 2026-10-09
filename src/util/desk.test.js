import { deskGuests, deskSummary, mergeDesk, partySize, rsvpHint } from './desk';

const guests = [
  { _id: '1', name: 'Chú Tư', group: 'Nhà trai', rsvp: { status: 'attending', count: 3 } },
  { _id: '2', name: 'Bác Hai', group: 'Nhà trai', arrivedAt: '2027-01-16T04:05:00Z', arrivedCount: 2 },
  { _id: '3', name: 'Cô Út', group: 'Nhà gái', rsvp: { status: 'declined', count: 0 } },
  { _id: '4', name: 'Anh Tư Hải', rsvp: { status: 'maybe', count: 2 } },
  { _id: '5', name: 'Bác Năm', source: 'desk', arrivedAt: '2027-01-16T04:10:00Z' },
];
const names = list => list.map(g => g.name);

describe('partySize', () => {
  it('starts from the answer, else one', () => {
    expect(guests.map(partySize)).toEqual([3, 1, 1, 2, 1]);
    expect(partySize({ rsvp: { status: 'attending', count: 99 } })).toBe(20);
  });
});

describe('rsvpHint', () => {
  it('says what the guest answered', () => {
    expect(guests.map(rsvpHint)).toEqual(['Báo đến · 3 người', 'Chưa trả lời', 'Báo không đến', 'Chưa chắc đến', 'Thêm tại tiệc']);
    expect(rsvpHint({ rsvp: { status: 'attending', count: 1 } })).toBe('Báo đến');
  });
});

describe('deskGuests', () => {
  it('shows who has not come yet by default', () => {
    expect(names(deskGuests(guests))).toEqual(['Chú Tư', 'Cô Út', 'Anh Tư Hải']);
    expect(names(deskGuests(guests, { tab: 'arrived' }))).toEqual(['Bác Hai', 'Bác Năm']);
    expect(deskGuests(guests, { tab: 'all' })).toHaveLength(5);
  });

  it('keeps a guest just checked in on screen', () => {
    const arrived = guests.map(g => (g._id === '1' ? { ...g, arrivedAt: 'now' } : g));
    expect(names(deskGuests(arrived, { keep: new Set(['1']) }))).toEqual(['Chú Tư', 'Cô Út', 'Anh Tư Hải']);
    expect(names(deskGuests(arrived))).toEqual(['Cô Út', 'Anh Tư Hải']);
  });

  it('searches everyone without accents, best match first', () => {
    expect(names(deskGuests(guests, { query: 'tu' }))).toEqual(['Chú Tư', 'Anh Tư Hải']);
    expect(names(deskGuests(guests, { query: 'bac', tab: 'waiting' }))).toEqual(['Bác Hai', 'Bác Năm']);
    expect(names(deskGuests(guests, { query: 'tu hai' }))).toEqual(['Anh Tư Hải']);
    expect(deskGuests(guests, { query: 'xyz' })).toEqual([]);
  });

  it('filters by group, "" for guests without one', () => {
    expect(names(deskGuests(guests, { group: 'Nhà trai', tab: 'all' }))).toEqual(['Chú Tư', 'Bác Hai']);
    expect(names(deskGuests(guests, { group: '', tab: 'all' }))).toEqual(['Anh Tư Hải', 'Bác Năm']);
    expect(names(deskGuests(guests, { group: 'Nhà trai', query: 'tu' }))).toEqual(['Chú Tư']);
  });
});

describe('deskSummary', () => {
  it('counts arrivals, people and who said they would come', () => {
    expect(deskSummary(guests)).toEqual({ guests: 5, arrived: 2, people: 3, expected: 3 });
  });
});

describe('mergeDesk', () => {
  it('takes the server list but keeps changes still on their way', () => {
    const local = [{ _id: '1', name: 'A', arrivedAt: 'x', arrivedCount: 3 }, { _id: '2', name: 'B' }];
    const server = [{ _id: '1', name: 'A' }, { _id: '2', name: 'B', arrivedAt: 'y' }, { _id: '3', name: 'C' }];
    expect(mergeDesk(local, server, new Set())).toBe(server);
    expect(mergeDesk(local, server, new Set(['1']))).toEqual([local[0], server[1], server[2]]);
  });
});
