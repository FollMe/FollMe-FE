/** The fintech knowledge pages. The hub and the search read this. */
const ARTICLES = [
  {
    slug: 'money-movement',
    to: '/fintech/money-movement',
    tag: 'Bài nền · đọc trước',
    order: 1,
    title: 'Money movement: tiền trong ví thật ra nằm ở đâu?',
    description: 'Bạn nạp 100k, số dư trên app tăng ngay, nhưng tiền thật đang nằm ở đâu? Bài nền về ledger, safeguarding account và settlement, áp dụng cho mọi thao tác có tiền trong ví. Có mô phỏng để bấm thử.',
    keywords: 'money movement ledger bank safeguarding tai khoan dam bao thanh toan nghi dinh 52 settlement netting prefund napas citad',
    topics: ['Ledger vs bank', 'Safeguarding', 'Settlement topology', 'Netting'],
    ladder: ['ledger: promise', 'bank: cash', 'Σ wallets ≤ cash', 'same bank → per txn'],
  },
  {
    slug: 'billpay',
    to: '/fintech/billpay',
    tag: 'Trả hoá đơn, bảo hiểm, mua vé',
    order: 3,
    title: 'Billpay: trả hoá đơn trong ví hoạt động thế nào',
    description: 'Bạn bấm trả tiền điện, nhập PIN, hoá đơn được gạch nợ. Phía sau, team billpay không thấy lúc tiền bị trừ và còn phải nhờ partner gạch nợ. Bài đi qua từng bước, hai variant hold/debit, event và reconciliation.',
    keywords: 'billpay tra hoa don thanh toan bao hiem ve kafka outbox reconciliation skip locked hold commit rollback refund',
    topics: ['Sequence', 'State machine', 'Outbox', 'Reconciliation', 'SKIP LOCKED'],
    ladder: ['draft', 'pending_payment', 'partner_processing', 'success'],
  },
  {
    slug: 'savings-fund',
    to: '/fintech/savings-fund',
    tag: 'Gửi tiết kiệm sinh lời',
    order: 2,
    title: 'Gửi tiết kiệm sinh lời trong ví: flow nộp và rút',
    description: 'Bạn bấm Gửi tiết kiệm 100k, vài giây sau có lãi. Phía sau, tiền đi qua ví, partner và ngân hàng. Xem từng bước qua sequence chạy được, tiền đang nằm ở đâu, và state machine với các scenario lỗi.',
    keywords: 'auto earn tiet kiem quy nop rut deposit withdraw state machine saga idempotency doi soat',
    topics: ['Sequence', 'State machine', 'Idempotency', 'Compensation', 'Two sources of truth'],
    ladder: ['ORDER_RECEIVED', 'WALLET_HELD', 'PARTNER_RESERVED', 'WALLET_DEBITED', 'PAYOUT_SUCCEEDED', 'COMPLETED'],
  },
];

/** In reading order: the foundations first, then the flows built on them. */
export const FINTECH_ARTICLES = [...ARTICLES].sort((a, b) => a.order - b.order);
