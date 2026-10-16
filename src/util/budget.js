// The budget (thu chi): what the host spends on the day, next to what the
// gift ledger says came in. Amounts in VND.

export const MAX_EXPENSES = 100;
export const MAX_EXPENSE_LABEL = 60;
export const MAX_EXPENSE_NOTE = 100;

export const EXPENSE_CATEGORIES = [
  { value: 'venue', label: 'Tiệc', emoji: '🍽️' },
  { value: 'photo', label: 'Ảnh & quay phim', emoji: '📷' },
  { value: 'attire', label: 'Trang phục & trang điểm', emoji: '👗' },
  { value: 'rings', label: 'Nhẫn & trang sức', emoji: '💍' },
  { value: 'ceremony', label: 'Lễ & mâm quả', emoji: '🎁' },
  { value: 'decor', label: 'Trang trí & hoa', emoji: '💐' },
  { value: 'cards', label: 'Thiệp & quà', emoji: '💌' },
  { value: 'music', label: 'MC & âm nhạc', emoji: '🎤' },
  { value: 'travel', label: 'Xe & đi lại', emoji: '🚗' },
  { value: 'honeymoon', label: 'Trăng mật', emoji: '✈️' },
  { value: 'other', label: 'Khác', emoji: '🧾' },
];

const CATEGORY = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.value, c]));
export const categoryOf = value => CATEGORY[value] ?? CATEGORY.other;

/** A first list to fill in, by the kind of event: [category, label]. */
const STARTERS = {
  wedding: [
    ['venue', 'Tiệc cưới'],
    ['photo', 'Chụp ảnh cưới'],
    ['photo', 'Quay phim, chụp phóng sự'],
    ['attire', 'Váy cưới, vest'],
    ['attire', 'Trang điểm cô dâu'],
    ['rings', 'Nhẫn cưới'],
    ['ceremony', 'Mâm quả, sính lễ'],
    ['decor', 'Trang trí, hoa cưới'],
    ['cards', 'In thiệp'],
    ['music', 'MC, ban nhạc'],
    ['travel', 'Xe hoa'],
  ],
  engagement: [
    ['ceremony', 'Mâm quả'],
    ['venue', 'Tiệc thân mật'],
    ['attire', 'Áo dài, trang điểm'],
    ['decor', 'Trang trí, phông lễ'],
    ['photo', 'Chụp ảnh'],
    ['travel', 'Xe đưa đón'],
  ],
  other: [
    ['venue', 'Tiệc'],
    ['decor', 'Trang trí'],
    ['photo', 'Chụp ảnh'],
    ['music', 'Âm nhạc'],
  ],
};

export function starterExpenses(type) {
  return (STARTERS[type] ?? STARTERS.other).map(([category, label]) => ({ category, label }));
}

/** Paid so far, never more than the cost when the cost is known. */
const paidOf = e => Math.min(e.paid || 0, e.amount ?? Infinity);

/** Where a line stands: no cost yet, nothing paid, a deposit, or paid in full. */
export function expenseStatus(expense) {
  if (!expense.amount) {
    return expense.paid ? 'deposit' : 'unpriced';
  }
  const paid = paidOf(expense);
  if (paid >= expense.amount) {
    return 'paid';
  }
  return paid > 0 ? 'deposit' : 'unpaid';
}

/**
 * Totals of the budget, per category (largest first), and against the gift
 * ledger (`gifts`: what guests gave, in VND) and the planned total.
 */
export function budgetSummary(expenses = [], { gifts = 0, budget = null } = {}) {
  const summary = { total: 0, paid: 0, owed: 0, unpriced: 0, count: expenses.length, categories: [] };
  const byCategory = new Map();
  for (const e of expenses) {
    const amount = e.amount || 0;
    const paid = e.amount ? paidOf(e) : e.paid || 0;
    summary.total += amount;
    summary.paid += paid;
    summary.owed += Math.max(amount - paid, 0);
    if (!e.amount) {
      summary.unpriced += 1;
    }
    const key = categoryOf(e.category).value;
    const row = byCategory.get(key) ?? { category: key, total: 0, count: 0 };
    row.total += amount;
    row.count += 1;
    byCategory.set(key, row);
  }
  summary.categories = [...byCategory.values()].sort((a, b) => b.total - a.total || b.count - a.count);
  summary.gifts = gifts;
  // What the gifts leave once everything is paid: negative when they fall short
  summary.balance = gifts - summary.total;
  summary.coverage = summary.total > 0 ? gifts / summary.total : null;
  summary.budget = budget || null;
  summary.budgetUsed = budget ? summary.total / budget : null;
  return summary;
}

/** "Tiền mừng bù được 68% chi phí, còn thiếu 40.000.000 đ" and the like. */
export function balanceText(summary, formatVnd) {
  if (!summary.total) {
    return '';
  }
  if (!summary.gifts) {
    return 'Ghi tiền mừng vào Sổ mừng để so với chi phí.';
  }
  if (summary.balance >= 0) {
    return `Tiền mừng đủ bù chi phí, còn dư ${formatVnd(summary.balance)}.`;
  }
  return `Tiền mừng bù được ${Math.floor(summary.coverage * 100)}% chi phí, còn thiếu ${formatVnd(-summary.balance)}.`;
}

export const BUDGET_TABS = [
  ['all', 'Tất cả', () => true],
  ['owed', 'Còn phải trả', e => ['unpaid', 'deposit'].includes(expenseStatus(e)) && Boolean(e.amount)],
  ['unpriced', 'Chưa có giá', e => !e.amount],
];

/** The budget as spreadsheet rows, with the totals last. */
export function budgetRows(expenses = []) {
  const summary = budgetSummary(expenses);
  return [
    ['Khoản chi', 'Nhóm', 'Chi phí', 'Đã trả', 'Còn lại', 'Ghi chú'],
    ...expenses.map(e => [
      e.label,
      categoryOf(e.category).label,
      e.amount ?? '',
      e.paid ?? '',
      e.amount ? Math.max(e.amount - paidOf(e), 0) : '',
      e.note ?? '',
    ]),
    ['Tổng', '', summary.total, summary.paid, summary.owed, ''],
  ];
}
