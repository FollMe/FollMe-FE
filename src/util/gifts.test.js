import { formatVnd, giftSummary, ledgerGuests, ledgerRows, parseAmount, shortVnd } from './gifts';

describe('parseAmount', () => {
  it.each([
    ['500k', 500000],
    ['500K', 500000],
    ['500 nghìn', 500000],
    ['500 ngàn', 500000],
    ['1tr', 1000000],
    ['1 triệu', 1000000],
    ['1tr2', 1200000],
    ['1tr25', 1250000],
    ['2tr500', 2500000],
    ['1,5tr', 1500000],
    ['1.5 triệu', 1500000],
    ['2 củ', 2000000],
    ['1k5', 1500],
    ['500.000', 500000],
    ['500,000đ', 500000],
    ['1.000.000 VND', 1000000],
    ['2000000', 2000000],
    ['500', 500000],
    ['1200', 1200000],
    [' 300 ', 300000],
    ['10000', 10000],
    ['1 200 000', 1200000],
  ])('%s -> %d', (text, amount) => {
    expect(parseAmount(text)).toBe(amount);
  });

  it.each(['', 'abc', '1.5', '5 cái', '1tr2tr', '0', '-500k', '20000tr', '1..5tr'])('cannot read "%s"', text => {
    expect(parseAmount(text)).toBeNull();
  });
});

describe('formatVnd and shortVnd', () => {
  it('writes amounts the Vietnamese way', () => {
    expect(formatVnd(1200000)).toBe('1.200.000 đ');
    expect(formatVnd(500)).toBe('500 đ');
    expect(formatVnd(0)).toBe('0 đ');
    expect([200000, 500000, 1000000, 1200000, 2500000].map(shortVnd)).toEqual(['200k', '500k', '1tr', '1,2tr', '2,5tr']);
  });
});

const guests = [
  { _id: '1', name: 'Chú Tư', group: 'Nhà trai', gift: { amount: 1000000, at: '2027-01-17T02:00:00Z' } },
  { _id: '2', name: 'Bác Hai', group: 'Nhà trai', arrivedAt: '2027-01-16T04:00:00Z' },
  { _id: '3', name: 'Cô Út', group: 'Nhà gái', gift: { note: '1 chỉ vàng', at: '2027-01-17T03:00:00Z' } },
  { _id: '4', name: 'Anh Tuấn' },
  { _id: '5', name: 'Chị Lan', gift: { amount: 500000, note: 'Chuyển khoản', at: '2027-01-17T01:00:00Z' }, arrivedAt: 'x', arrivedCount: 2 },
];
const names = list => list.map(g => g.name);

describe('giftSummary', () => {
  it('adds up money, counts gifts that are not money, per group', () => {
    expect(giftSummary(guests)).toEqual({
      count: 3,
      total: 1500000,
      notes: 1,
      groups: [
        { group: 'Nhà trai', count: 1, total: 1000000 },
        { group: 'Nhà gái', count: 1, total: 0 },
        { group: '', count: 1, total: 500000 },
      ],
    });
  });
});

describe('ledgerGuests', () => {
  it('lists who is left, guests who came first', () => {
    expect(names(ledgerGuests(guests))).toEqual(['Bác Hai', 'Anh Tuấn']);
  });

  it('lists the latest entries first', () => {
    expect(names(ledgerGuests(guests, { tab: 'done' }))).toEqual(['Cô Út', 'Chú Tư', 'Chị Lan']);
  });

  it('searches everyone without accents', () => {
    expect(names(ledgerGuests(guests, { query: 'chu tu' }))).toEqual(['Chú Tư']);
    expect(names(ledgerGuests(guests, { query: 'tu', group: 'Nhà trai' }))).toEqual(['Chú Tư']);
    expect(names(ledgerGuests(guests, { group: '', tab: 'all' }))).toEqual(['Anh Tuấn', 'Chị Lan']);
  });
});

describe('ledgerRows', () => {
  it('has one row per gift and the total last', () => {
    const rows = ledgerRows(guests, at => at.slice(0, 10));
    expect(rows[0]).toEqual(['Tên', 'Nhóm', 'Số tiền', 'Ghi chú', 'Đã đến tiệc', 'Ghi lúc']);
    expect(rows.slice(1, -1).map(r => r[0])).toEqual(['Chú Tư', 'Cô Út', 'Chị Lan']);
    expect(rows[3]).toEqual(['Chị Lan', '', 500000, 'Chuyển khoản', 'Có, 2 người', '2027-01-17']);
    expect(rows[rows.length - 1]).toEqual(['Tổng', '3 người mừng', 1500000, '', '', '']);
  });
});
