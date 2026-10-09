import { autoSeat, compareTables, nextTable, seatingPlan, seatingRows, seatsNeeded, tableLabel } from './seating';

const g = (id, group, rsvp, extra = {}) => ({ _id: id, name: `K${id}`, group, rsvp, ...extra });
const yes = count => ({ status: 'attending', count });

describe('tableLabel and compareTables', () => {
  it('names numbered tables, keeps typed names', () => {
    expect(tableLabel('12')).toBe('Bàn 12');
    expect(tableLabel('VIP')).toBe('VIP');
    expect(['10', 'VIP', '2', '1', 'Bàn A'].sort(compareTables)).toEqual(['1', '2', '10', 'Bàn A', 'VIP']);
  });
});

describe('seatsNeeded', () => {
  it('counts who came, else the answer, else one; none if not coming', () => {
    expect(seatsNeeded(g(1, '', yes(3)))).toBe(3);
    expect(seatsNeeded(g(1, '', { status: 'maybe', count: 2 }))).toBe(2);
    expect(seatsNeeded(g(1, '', { status: 'declined', count: 0 }))).toBe(0);
    expect(seatsNeeded(g(1, ''))).toBe(1);
    expect(seatsNeeded(g(1, '', yes(3), { arrivedAt: 'x', arrivedCount: 5 }))).toBe(5);
  });
});

describe('seatingPlan', () => {
  it('lists tables in order with seats taken, and who still needs one', () => {
    const plan = seatingPlan([
      g(1, 'Nhà trai', yes(3), { table: '2' }),
      g(2, 'Nhà trai', yes(2), { table: '10' }),
      g(3, 'Nhà gái', yes(4), { table: '2' }),
      g(4, 'Nhà gái', yes(2)),
      g(5, 'Bạn bè', { status: 'declined', count: 0 }),
    ], 10);
    expect(plan.tables.map(t => [t.table, t.people, t.free, t.group])).toEqual([['2', 7, 3, 'Nhà gái'], ['10', 2, 8, 'Nhà trai']]);
    expect(plan.unseated.map(x => x._id)).toEqual([4]);
    expect([plan.seated, plan.waiting]).toEqual([9, 2]);
  });
});

describe('nextTable', () => {
  it('follows the highest number', () => {
    expect(nextTable([])).toBe('1');
    expect(nextTable(['1', '9', 'VIP', '3'])).toBe('10');
  });
});

describe('autoSeat', () => {
  it('keeps each side at its own tables and families whole', () => {
    const guests = [
      g(1, 'Nhà trai', yes(4)), g(2, 'Nhà trai', yes(6)), g(3, 'Nhà trai', yes(3)),
      g(4, 'Nhà gái', yes(2)), g(5, 'Nhà gái'), g(6, 'Nhà gái', { status: 'declined', count: 0 }),
      g(7, '', yes(2)),
    ];
    const { seats, opened } = autoSeat(guests, 10);
    const at = Object.fromEntries(seats.map(s => [s.guest._id, s.table]));
    // Nhà trai: 6 + 4 at table 1, then 3 at table 2; Nhà gái at 3; no group at 4
    expect(at).toEqual({ 2: '1', 1: '1', 3: '2', 4: '3', 5: '3', 7: '4' });
    expect(opened).toEqual(['1', '2', '3', '4']);
  });

  it('fills a table of the same group that has room before opening one', () => {
    const guests = [
      g(1, 'Nhà gái', yes(6), { table: '5' }),
      g(2, 'Nhà gái', yes(3)),
      g(3, 'Nhà trai', yes(2)),
      g(4, 'Nhà gái', yes(2)),
    ];
    const { seats, opened } = autoSeat(guests, 10);
    expect(seats.map(s => [s.guest._id, s.table])).toEqual([[2, '5'], [4, '6'], [3, '7']]);
    expect(opened).toEqual(['6', '7']);
  });

  it('gives a party bigger than a table a table of its own', () => {
    const { seats } = autoSeat([g(1, '', yes(12)), g(2, '', yes(1))], 10);
    expect(seats.map(s => s.table)).toEqual(['1', '2']);
  });
});

describe('seatingRows', () => {
  it('lists guests table by table, then who is not seated', () => {
    const rows = seatingRows([g(1, 'A', yes(2), { table: '2' }), g(2, 'B', yes(1), { table: '1' }), g(3, '', undefined)]);
    expect(rows).toEqual([
      ['Bàn', 'Tên', 'Nhóm', 'Số người'],
      ['Bàn 1', 'K2', 'B', 1],
      ['Bàn 2', 'K1', 'A', 2],
      ['Chưa xếp', 'K3', '', 1],
    ]);
  });
});
