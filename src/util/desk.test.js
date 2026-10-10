import {
  applyPending, cacheDesk, deskGuests, deskSummary, forgetDesk, loadCachedDesk, loadPending, partySize, rsvpHint, savePending,
  tablesWithRoom,
} from './desk';

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

describe('check-ins waiting for the network', () => {
  const list = [
    { _id: '1', name: 'A' },
    { _id: '2', name: 'B', arrivedAt: '2027-01-16T04:00:00Z', arrivedCount: 2 },
    { _id: '3', name: 'C', arrivedAt: '2027-01-16T04:05:00Z', arrivedCount: 1 },
  ];

  it('shows them on top of the server list', () => {
    const shown = applyPending(list, {
      1: { arrived: true, count: 3, at: '2027-01-16T04:10:00Z' },
      2: { arrived: true, count: 4, at: '2027-01-16T04:11:00Z' },
      3: { arrived: false, at: '2027-01-16T04:12:00Z' },
    });
    expect(shown).toEqual([
      { _id: '1', name: 'A', arrivedAt: '2027-01-16T04:10:00Z', arrivedCount: 3 },
      { _id: '2', name: 'B', arrivedAt: '2027-01-16T04:00:00Z', arrivedCount: 4 },
      { _id: '3', name: 'C' },
    ]);
    expect(applyPending(list, {})).toEqual(list);
  });

  it('are kept per event across reloads', () => {
    savePending('e1', { 1: { arrived: true, count: 2, at: 'x' } });
    expect(loadPending('e1')).toEqual({ 1: { arrived: true, count: 2, at: 'x' } });
    expect(loadPending('e2')).toEqual({});
    savePending('e1', {});
    expect(localStorage.getItem('follme.desk.e1.pending')).toBeNull();
    cacheDesk('e1', { event: { _id: 'e1' }, guests: list });
    expect(loadCachedDesk('e1').guests).toHaveLength(3);
    expect(loadCachedDesk('e2')).toBeNull();
    savePending('e1', { 1: { arrived: true, at: 'x' } });
    forgetDesk('e1');
    expect([loadPending('e1'), loadCachedDesk('e1')]).toEqual([{}, null]);
  });
});

describe('tables at the desk', () => {
  it('applies a table chosen while waiting, keeps the count', () => {
    const list = [{ _id: '1', name: 'A', arrivedAt: 'x', arrivedCount: 2, table: '3' }];
    expect(applyPending(list, { 1: { arrived: true, table: '5', at: 'y' } })).toEqual([
      { _id: '1', name: 'A', arrivedAt: 'x', arrivedCount: 2, table: '5' },
    ]);
    expect(applyPending(list, { 1: { arrived: true, table: '', at: 'y' } })).toEqual([
      { _id: '1', name: 'A', arrivedAt: 'x', arrivedCount: 2 },
    ]);
  });

  it('offers tables with room, the guest\'s group first', () => {
    const plan = { tables: [
      { table: '1', group: 'Nhà trai', free: 1 },
      { table: '2', group: 'Nhà gái', free: 4 },
      { table: '3', group: 'Nhà trai', free: 3 },
      { table: '4', group: '', free: 6 },
    ] };
    expect(tablesWithRoom(plan, 2, 'Nhà trai').map(t => t.table)).toEqual(['3', '2', '4']);
    expect(tablesWithRoom(plan, 5).map(t => t.table)).toEqual(['4']);
    expect(tablesWithRoom(plan, 9)).toEqual([]);
  });
});
