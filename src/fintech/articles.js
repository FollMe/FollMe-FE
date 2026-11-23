/** The fintech knowledge pages, newest first. The hub and the search read this. */
export const FINTECH_ARTICLES = [
  {
    slug: 'money-movement',
    to: '/fintech/money-movement',
    tag: 'Nền tảng · đọc trước',
    title: 'Money movement: tiền thật sự đi như thế nào',
    description: 'Hai layer ledger và bank, safeguarding account theo Nghị định 52/2024, cùng bank hay khác bank, settle từng giao dịch hay prefund + netting. Có mô phỏng để bấm thử.',
    keywords: 'money movement ledger bank safeguarding tai khoan dam bao thanh toan nghi dinh 52 settlement netting prefund napas citad',
    topics: ['Ledger vs bank', 'Safeguarding', 'Settlement topology', 'Netting'],
    ladder: ['ledger: promise', 'bank: cash', 'Σ wallets ≤ cash', 'same bank → per txn'],
  },
  {
    slug: 'billpay',
    to: '/fintech/billpay',
    tag: 'Payment + fulfillment · Reconciliation',
    title: 'Billpay: trả hoá đơn qua ví',
    description: 'Team service tạo payment session, user trả ở màn hình của Core, rồi team service gọi partner gạch nợ. Xem hai variant hold và debit, cách lấp khoảng mù bằng Kafka outbox, và reconciliation bằng SKIP LOCKED.',
    keywords: 'billpay tra hoa don thanh toan bao hiem ve kafka outbox reconciliation skip locked hold commit rollback refund',
    topics: ['Sequence', 'State machine', 'Outbox', 'Reconciliation', 'SKIP LOCKED'],
    ladder: ['draft', 'pending_payment', 'partner_processing', 'success'],
  },
  {
    slug: 'savings-fund',
    to: '/fintech/savings-fund',
    tag: 'Money movement · Saga',
    title: 'Nộp & rút tiền vào quỹ tiết kiệm',
    description: 'Ví chuyển tiền của user sang quỹ do partner quản lý để hưởng lãi, rồi rút về. Xem từng bước qua sequence chạy được, 100k đang nằm ở đâu, và state machine với các failure scenario.',
    keywords: 'auto earn tiet kiem quy nop rut deposit withdraw state machine saga idempotency doi soat',
    topics: ['Sequence', 'State machine', 'Idempotency', 'Compensation', 'Two sources of truth'],
    ladder: ['ORDER_RECEIVED', 'WALLET_HELD', 'PARTNER_RESERVED', 'WALLET_DEBITED', 'PAYOUT_SUCCEEDED', 'COMPLETED'],
  },
];
