import {
  BUDGET_TABS, balanceText, budgetRows, budgetSummary, categoryOf, expenseStatus, starterExpenses,
} from './budget';
import { formatVnd } from './gifts';

const expenses = [
  { _id: '1', label: 'Tiệc cưới', category: 'venue', amount: 150_000_000, paid: 50_000_000 },
  { _id: '2', label: 'Ảnh cưới', category: 'photo', amount: 20_000_000, paid: 20_000_000 },
  { _id: '3', label: 'Quay phim', category: 'photo', amount: 10_000_000 },
  { _id: '4', label: 'Nhẫn cưới', category: 'rings' },
  // Paid more than the cost by mistake: counts as paid in full
  { _id: '5', label: 'Xe hoa', category: 'travel', amount: 3_000_000, paid: 5_000_000, note: 'Thuê 4 tiếng' },
  // A deposit before the price is settled
  { _id: '6', label: 'MC', category: 'music', paid: 1_000_000 },
];

describe('expenseStatus', () => {
  it('tells unpriced, unpaid, deposit and paid apart', () => {
    expect(expenses.map(expenseStatus)).toEqual(['deposit', 'paid', 'unpaid', 'unpriced', 'paid', 'deposit']);
  });
});

describe('budgetSummary', () => {
  it('sums costs, payments and what is still owed, by category', () => {
    const s = budgetSummary(expenses, { gifts: 120_000_000, budget: 250_000_000 });
    expect(s.total).toBe(183_000_000);
    expect(s.paid).toBe(50_000_000 + 20_000_000 + 3_000_000 + 1_000_000);
    expect(s.owed).toBe(100_000_000 + 10_000_000);
    expect(s.unpriced).toBe(2);
    expect(s.categories.map(c => [c.category, c.total, c.count])).toEqual([
      ['venue', 150_000_000, 1], ['photo', 30_000_000, 2], ['travel', 3_000_000, 1], ['rings', 0, 1], ['music', 0, 1],
    ]);
    expect(s.balance).toBe(-63_000_000);
    expect(s.coverage).toBeCloseTo(120 / 183);
    expect(s.budgetUsed).toBeCloseTo(183 / 250);
  });

  it('has nothing to compare without costs or a planned total', () => {
    const s = budgetSummary([], {});
    expect([s.total, s.coverage, s.budget, s.budgetUsed]).toEqual([0, null, null, null]);
  });
});

describe('balanceText', () => {
  it('says how far the gifts go', () => {
    const fmt = formatVnd;
    expect(balanceText(budgetSummary(expenses, { gifts: 120_000_000 }), fmt))
      .toBe('Tiền mừng bù được 65% chi phí, còn thiếu 63.000.000 đ.');
    expect(balanceText(budgetSummary(expenses, { gifts: 200_000_000 }), fmt))
      .toBe('Tiền mừng đủ bù chi phí, còn dư 17.000.000 đ.');
    expect(balanceText(budgetSummary(expenses, { gifts: 0 }), fmt)).toBe('Ghi tiền mừng vào Sổ mừng để so với chi phí.');
    expect(balanceText(budgetSummary([], { gifts: 5 }), fmt)).toBe('');
  });
});

describe('lists', () => {
  it('filters what is owed and what has no price', () => {
    const ids = key => expenses.filter(BUDGET_TABS.find(([k]) => k === key)[2]).map(e => e._id);
    expect(ids('owed')).toEqual(['1', '3']);
    expect(ids('unpriced')).toEqual(['4', '6']);
    expect(ids('all')).toHaveLength(6);
  });

  it('starts weddings from the usual expenses', () => {
    const list = starterExpenses('wedding');
    expect(list[0]).toEqual({ category: 'venue', label: 'Tiệc cưới' });
    expect(list.every(e => categoryOf(e.category).value === e.category)).toBe(true);
    expect(starterExpenses('birthday')[0].label).toBe('Tiệc');
    expect(categoryOf('nope').label).toBe('Khác');
  });

  it('exports rows with totals', () => {
    const rows = budgetRows(expenses);
    expect(rows[0]).toEqual(['Khoản chi', 'Nhóm', 'Chi phí', 'Đã trả', 'Còn lại', 'Ghi chú']);
    expect(rows[5]).toEqual(['Xe hoa', 'Xe & đi lại', 3_000_000, 5_000_000, 0, 'Thuê 4 tiếng']);
    expect(rows[4]).toEqual(['Nhẫn cưới', 'Nhẫn & trang sức', '', '', '', '']);
    expect(rows[rows.length - 1]).toEqual(['Tổng', '', 183_000_000, 74_000_000, 110_000_000, '']);
  });
});
