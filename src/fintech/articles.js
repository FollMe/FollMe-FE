/** The fintech knowledge pages, newest first. The hub and the search read this. */
export const FINTECH_ARTICLES = [
  {
    slug: 'savings-fund',
    to: '/fintech/savings-fund',
    tag: 'Money movement · Saga',
    title: 'Nộp & rút tiền vào quỹ tiết kiệm',
    description: 'Ví chuyển tiền của user sang quỹ do partner quản lý để hưởng lãi, rồi rút về. Xem từng bước qua sequence chạy được, 100k đang nằm ở đâu, và state machine với các failure scenario.',
    keywords: 'auto earn tiet kiem quy nop rut deposit withdraw state machine saga idempotency doi soat',
    topics: ['Sequence', 'State machine', 'Idempotency', 'Compensation', 'Two sources of truth'],
  },
];
