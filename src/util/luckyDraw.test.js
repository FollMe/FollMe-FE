import { drawWinner, poolEntries, reel, secureIndex } from './luckyDraw';

const event = {
  seatsPerTable: 10,
  guests: [
    { _id: '1', name: 'Cô Năm', group: 'Nhà gái', table: '2', arrivedAt: '2026-12-15T10:00:00Z', arrivedCount: 3 },
    { _id: '2', name: 'Chú Tư', group: 'Nhà trai', rsvp: { status: 'attending', count: 2 }, table: '10' },
    { _id: '3', name: 'Bác Hai', rsvp: { status: 'declined' } },
  ],
  wishes: [
    { name: 'Minh' }, { name: 'minh ' }, { name: 'Lan', isHidden: true }, { name: 'Đức' },
  ],
};

describe('poolEntries', () => {
  it('draws from who came, or who said they would', () => {
    expect(poolEntries(event, 'arrived')).toEqual([{ id: 'g:1', name: 'Cô Năm', note: 'Bàn 2 · Nhà gái' }]);
    expect(poolEntries(event, 'attending').map(e => e.name)).toEqual(['Cô Năm', 'Chú Tư']);
  });

  it('counts each wisher once, not hidden wishes', () => {
    expect(poolEntries(event, 'wishes').map(e => e.name)).toEqual(['Minh', 'Đức']);
  });

  it('lists tables in counting order', () => {
    expect(poolEntries(event, 'tables').map(e => `${e.name} ${e.note}`)).toEqual(['Bàn 2 3 người', 'Bàn 10 2 người']);
  });

  it('makes lucky numbers and reads a typed list', () => {
    expect(poolEntries(event, 'numbers', { numbers: 3 }).map(e => e.name)).toEqual(['1', '2', '3']);
    expect(poolEntries(event, 'numbers', { numbers: -4 })).toEqual([]);
    expect(poolEntries(event, 'custom', { custom: 'An\n\n Bình \nan\nChi' }).map(e => e.name)).toEqual(['An', 'Bình', 'Chi']);
  });
});

describe('drawing', () => {
  const entries = ['a', 'b', 'c'].map(id => ({ id, name: id }));

  it('is uniform: rejects values that would favor some', () => {
    const values = [0xffffffff, 7];
    expect(secureIndex(3, () => values.shift())).toBe(1);
    expect(secureIndex(1, () => 5)).toBe(0);
  });

  it('never draws a winner twice unless asked', () => {
    expect(drawWinner(entries, [{ id: 'a' }, { id: 'b' }])).toEqual({ id: 'c', name: 'c' });
    expect(drawWinner(entries, entries)).toBeNull();
    expect(drawWinner(entries, entries, { once: false })).not.toBeNull();
  });

  it('flashes names, ending on the winner, slower and slower', () => {
    const { names, delays } = reel(entries, entries[1], 20);
    expect(names).toHaveLength(20);
    expect(names[19]).toBe(entries[1]);
    expect(names.every((n, i) => i === 0 || n.id !== names[i - 1].id || i === 19)).toBe(true);
    expect(delays[19]).toBeGreaterThan(delays[0] * 5);
  });
});
