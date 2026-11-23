/**
 * The safeguarding rule as a tiny simulator: ledger balances (user wallets
 * and merchant pockets, all liabilities) against real cash in the
 * safeguarding account. Amounts are in millions of VND.
 */

export const INITIAL = { user: 10, pocket: 0, cash: 10.5, drift: false };

export const ACTIONS = {
  topup: {
    label: 'User nạp 1M từ bank',
    // Cash lands first, the wallet credit posts a moment later
    phases: [
      { layer: 'bank', apply: s => ({ ...s, cash: s.cash + 1 }), note: 'Tiền tới safeguarding account trước. Bank layer đi trước, user chưa thấy gì.' },
      { layer: 'ledger', apply: s => ({ ...s, user: s.user + 1 }), note: 'Rồi ledger mới credit ví user. Trong lúc chờ, cash cao hơn liabilities một chút, chuyện bình thường.' },
    ],
  },
  deposit: {
    label: 'User gửi 1M vào quỹ partner',
    can: s => s.user >= 1,
    phases: [
      { layer: 'ledger', apply: s => ({ ...s, user: s.user - 1, pocket: s.pocket + 1 }), note: 'Ví user −1M, pocket partner +1M. Tổng liabilities không đổi, tiền chỉ đổi người giữ. Safeguarding account không đụng tới.' },
    ],
  },
  payout: {
    label: 'Payout pocket → bank partner',
    can: s => s.pocket >= 1,
    phases: [
      { layer: 'both', apply: s => ({ ...s, pocket: s.pocket - 1, cash: s.cash - 1 }), note: 'Pocket −1M và cash −1M cùng lúc. Hai bên đi cùng nhau nên phép so sánh vẫn đúng.' },
    ],
  },
  brokenPayout: {
    label: 'Payout lỗi: pocket bị trừ, bank fail',
    can: s => s.pocket >= 1,
    phases: [
      { layer: 'ledger', apply: s => ({ ...s, pocket: s.pocket - 1, drift: true }), note: 'Pocket bị trừ nhưng lệnh bank fail. Liabilities giảm mà cash thì không. Nhìn thì vẫn "an toàn", nhưng ledger không còn giải thích được số dư bank nữa.' },
    ],
  },
  front: {
    label: 'Lấy safeguarding trả thay partner 1M',
    phases: [
      { layer: 'bank', apply: s => ({ ...s, cash: s.cash - 1 }), note: 'Cash giảm mà liabilities giữ nguyên. Đây chính là cho bên thứ ba vay tiền của user, điều luật cấm.' },
    ],
  },
};

export const liabilities = s => s.user + s.pocket;

/** ok, drift (over-collateralised but unexplained) or breach (cash below liabilities). */
export function health(s) {
  if (s.cash < liabilities(s) - 1e-9) return 'breach';
  if (s.drift) return 'drift';
  return 'ok';
}

/** Runs every phase of an action, for tests and for jumping straight to the end. */
export function runAction(state, key) {
  return ACTIONS[key].phases.reduce((s, p) => p.apply(s), state);
}
