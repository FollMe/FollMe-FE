import { byName, byTable, nameLetter } from './seatingSheet';

const guests = [
  { _id: '1', name: 'Đức Huy', table: '2', rsvp: { status: 'attending', count: 2 } },
  { _id: '2', name: 'Anh Tuấn', table: '10' },
  { _id: '3', name: 'Út Lan', table: '2', group: 'Nhà gái' },
  { _id: '4', name: 'anh Ba', table: 'VIP' },
  { _id: '5', name: 'Chị Mai' },
  { _id: '6', name: 'Dũng', table: '1' },
];

describe('nameLetter', () => {
  it('files names by their first letter, Đ on its own', () => {
    expect(['Đức', 'đào', 'Út', 'ánh', 'Bình', '3 Bác', ''].map(nameLetter)).toEqual(['Đ', 'Đ', 'U', 'A', 'B', '#', '#']);
  });
});

describe('byName', () => {
  it('lists seated guests in Vietnamese order, a section per letter', () => {
    const sections = byName(guests);
    expect(sections.map(s => [s.letter, s.rows.map(r => `${r.name}:${r.table}`)])).toEqual([
      ['A', ['anh Ba:VIP', 'Anh Tuấn:10']],
      ['D', ['Dũng:1']],
      ['Đ', ['Đức Huy:2']],
      ['U', ['Út Lan:2']],
    ]);
    expect(sections[2].rows[0].people).toBe(2);
  });
});

describe('byTable', () => {
  it('lists tables in order with their guests and people', () => {
    expect(byTable(guests).map(t => [t.table, t.people, t.guests.map(g => g.name)])).toEqual([
      ['1', 1, ['Dũng']],
      ['2', 3, ['Đức Huy', 'Út Lan']],
      ['10', 1, ['Anh Tuấn']],
      ['VIP', 1, ['anh Ba']],
    ]);
  });
});
