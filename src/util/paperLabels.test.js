import { LAYOUTS, addressee, labelGuests, labelPages, nameSize } from './paperLabels';

describe('addressee', () => {
  it('adds who comes along, unless the name says it', () => {
    expect(addressee('Cô Năm')).toBe('Cô Năm và\u00a0gia\u00a0đình');
    expect(addressee('Bạn Huy', 'partner').replace(/\u00a0/g, ' ')).toBe('Bạn Huy và người thương');
    expect(addressee('Anh Tuấn & chị Hà')).toBe('Anh Tuấn & chị Hà');
    expect(addressee('Gia đình chú Tư')).toBe('Gia đình chú Tư');
    expect(addressee('  Minh ', 'none')).toBe('Minh');
  });
});

describe('labelGuests', () => {
  const guests = [
    { _id: '1', name: 'Út', group: 'Nhà trai' },
    { _id: '2', name: 'Ánh', group: 'Nhà gái', sentAt: '2026-10-01' },
    { _id: '3', name: 'Bình', group: 'Nhà trai' },
    { _id: '4', name: 'Khách link chung', source: 'public' },
    { _id: '5', name: 'Đến tiệc', source: 'desk' },
  ];

  it('only invited guests, by group then name', () => {
    expect(labelGuests(guests).map(g => g._id)).toEqual(['2', '3', '1']);
  });

  it('filters by group and not yet sent', () => {
    expect(labelGuests(guests, { group: 'Nhà trai' }).map(g => g._id)).toEqual(['3', '1']);
    expect(labelGuests(guests, { unsentOnly: true }).map(g => g._id)).toEqual(['3', '1']);
  });
});

describe('labelPages', () => {
  const layout = LAYOUTS[0];

  it('fills sheets of 21, the last padded', () => {
    const guests = Array.from({ length: 25 }, (_, i) => ({ _id: String(i) }));
    const pages = labelPages(guests, layout);
    expect(pages).toHaveLength(2);
    expect(pages[1].filter(Boolean)).toHaveLength(4);
    expect(pages[1]).toHaveLength(21);
  });

  it('skips labels already used on the first sheet', () => {
    const pages = labelPages([{ _id: 'a' }], layout, 5);
    expect(pages[0].indexOf(pages[0].find(Boolean))).toBe(5);
    expect(labelPages([{ _id: 'a' }], layout, 99)[0][20]).toEqual({ _id: 'a' });
  });

  it('prints nothing without guests', () => {
    expect(labelPages([], layout, 3)).toEqual([]);
  });
});

describe('nameSize', () => {
  it('shrinks long names', () => {
    expect(nameSize('Cô Năm và gia đình')).toBe('m');
    expect(nameSize('Anh Nguyễn Văn Tuấn và gia đình nhé')).toBe('s');
    expect(nameSize('x'.repeat(50))).toBe('xs');
  });
});
