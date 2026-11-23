/**
 * Billpay: a team service (bill pay, insurance, ticketing…) orchestrates a
 * payment the user makes at Core's own payment screen, then fulfils it with
 * a partner. Two variants, depending on what Core supports: hold → commit /
 * rollback, or a plain debit that is refunded when the partner fails.
 *
 * Same shape as fintech/savingsFund.js, so the page reuses the sequence
 * player, the money map and the state machine.
 */

const PARTICIPANTS = [
  { id: 'app', label: 'App', role: 'User bấm trả tiền, rồi trả ở màn hình của Core' },
  { id: 'service', label: 'Team service', role: 'Orchestrator, giữ transaction và status' },
  { id: 'core', label: 'Core', role: 'Payment/wallet và payment screen dùng chung' },
  { id: 'kafka', label: 'Kafka', role: 'Kênh để Core push kết quả về' },
  { id: 'partner', label: 'Partner', role: 'Nhà cung cấp, người thật sự gạch nợ hoá đơn' },
];

const BUCKETS = [
  { id: 'user', label: 'Ví user' },
  { id: 'core', label: 'Core đã trừ', hint: 'tiền đã rời ví user' },
  { id: 'bill', label: 'Hoá đơn ở partner' },
];

const STATES = [
  { id: 'draft', col: 1, row: 0, actor: 'us', meaning: 'Transaction vừa tạo, chưa có payment session', money: 'chưa động tới', deadline: 'Không cần recovery: chưa có tiền nào đi. Session request fail thì user bấm lại' },
  { id: 'pending_payment', col: 1, row: 1.4, actor: 'user', meaning: 'Core đã tạo session, user đang ở payment screen', money: 'có thể đã bị hold/debit ở Core mà mình chưa biết', deadline: 'Reconciliation hỏi Core get payment status: đã trả → partner_processing; fail → failed; chưa hề có payment → về draft' },
  { id: 'partner_processing', col: 1, row: 2.8, actor: 'partner', meaning: 'Core xác nhận đã trả, mình đang gọi partner', money: 'đã hold/debit ở Core', deadline: 'Reconciliation hỏi partner (và Core): success → commit → success; fail → rollback/refund → failed; vẫn chưa rõ → retry backoff 1s → 2s → 4s → 8s → 16s, hết thì mark failed và báo user' },
  { id: 'success', col: 1, row: 4.2, terminal: 'ok', meaning: 'Partner đã gạch nợ, tiền đã commit', money: 'đã trừ, hoá đơn đã trả' },
  { id: 'failed', col: 2, row: 2.1, terminal: 'fail', retryable: true, meaning: 'Payment fail ở Core, hoặc partner fail rồi đã rollback/refund', money: 'về lại ví user (hoặc chưa từng đi)' },
];

const TRANSITIONS = [
  ['draft', 'pending_payment', 'Core tạo session ok'],
  ['pending_payment', 'partner_processing', 'Core xác nhận đã trả (event hoặc poll)'],
  ['partner_processing', 'success', 'partner ok → commit / no-op'],
  ['partner_processing', 'failed', 'partner fail → rollback / refund'],
  ['pending_payment', 'draft', 'job thấy chưa hề có payment', -70],
  ['pending_payment', 'failed', 'Core xác nhận payment fail', 30],
  ['failed', 'pending_payment', 'user retry', 30],
];

const SCENARIOS = [
  {
    id: 'happy',
    label: 'Happy path',
    path: [
      ['draft', 'User bấm "Thanh toán", mình tạo transaction ở trạng thái draft.'],
      ['pending_payment', 'Core tạo session, check số dư và limit. Chưa có đồng nào đi. App chuyển sang payment screen của Core.'],
      ['partner_processing', 'User trả ở Core. Event "payment completed" về qua Kafka, mình upsert theo session ref.'],
      ['success', 'Partner gạch nợ thành công. Commit (hoặc no-op nếu Core chỉ debit).'],
    ],
  },
  {
    id: 'partner-fail',
    label: 'Partner fail',
    path: [
      ['draft', 'User bấm thanh toán.'],
      ['pending_payment', 'Có session, user sang payment screen.'],
      ['partner_processing', 'User đã trả, tiền đang hold/debit ở Core.'],
      ['failed', 'Partner trả về fail. Rollback hold, hoặc refund nếu Core chỉ debit. Refund cũng là một external call, nên cần idempotency key và retry như mọi call khác.'],
    ],
  },
  {
    id: 'core-fail',
    label: 'Payment fail ở Core',
    path: [
      ['draft', 'User bấm thanh toán.'],
      ['pending_payment', 'Có session, user sang payment screen.'],
      ['failed', 'Core báo payment fail, ví dụ thiếu tiền hay sai PIN. Chưa gọi partner, chưa có gì phải hoàn.'],
    ],
  },
  {
    id: 'abandon',
    label: 'User bỏ payment screen',
    path: [
      ['draft', 'User bấm thanh toán.'],
      ['pending_payment', 'Có session, nhưng user thoát khỏi payment screen.'],
      ['draft', 'Job hỏi Core và xác nhận chưa hề có payment nào. Trả transaction về draft.'],
      ['pending_payment', 'Lần sau user bấm lại, chạy lại từ bước tạo session.'],
      ['partner_processing', 'Lần này user trả xong.'],
      ['success', 'Partner gạch nợ.'],
    ],
  },
  {
    id: 'lost-event',
    label: 'Mất event Kafka',
    path: [
      ['draft', 'User bấm thanh toán.'],
      ['pending_payment', 'User đã trả ở Core, nhưng event bị mất. Team service đang bị "mù": tiền đã đi mà mình không biết.'],
      ['partner_processing', 'Quá timeout mà không có event, reconciliation tự hỏi Core get payment status và thấy đã trả.'],
      ['success', 'Gọi partner, gạch nợ, commit. Push để nhanh, pull để chắc.'],
    ],
  },
  {
    id: 'retry',
    label: 'User retry sau khi fail',
    path: [
      ['draft', 'User bấm thanh toán.'],
      ['pending_payment', 'Có session.'],
      ['failed', 'Core báo fail vì thiếu tiền.'],
      ['pending_payment', 'User nạp thêm rồi bấm lại. Retry chỉ là chạy lại bước tạo session từ đầu, y như lần đầu.'],
      ['partner_processing', 'Lần này trả được.'],
      ['success', 'Partner gạch nợ.'],
    ],
  },
];

function makeFlow(variant) {
  const hold = variant === 'hold';
  const steps = [
    {
      from: 'app', to: 'service', kind: 'call', label: 'tap "Pay"',
      state: 'draft',
      note: 'User bấm thanh toán. Team service tạo transaction, status do mình giữ chứ không phải client.',
      money: { user: '100k', bill: 'chưa trả' },
    },
    {
      from: 'service', to: 'core', kind: 'call', label: 'request payment session',
      state: 'draft',
      note: 'Nhờ Core tạo session: check số dư, check limit. Bước này chưa động vào tiền.',
      money: { user: '100k', bill: 'chưa trả' },
    },
    {
      from: 'core', to: 'service', kind: 'reply', label: 'session ok, chưa có tiền nào đi',
      state: 'pending_payment',
      note: 'Có session thì chuyển sang pending_payment. Từ đây tiền có thể đi bất cứ lúc nào, mà mình lại không ngồi trong luồng đó.',
      money: { user: '100k', bill: 'chưa trả' },
    },
    {
      from: 'service', to: 'app', kind: 'reply', label: 'OK → mở payment screen',
      state: 'pending_payment',
      note: 'App mở payment screen của Core. Màn hình này dùng chung cho mọi feature: chọn nguồn tiền, PIN, biometric, OTP.',
      money: { user: '100k', bill: 'chưa trả' },
    },
    {
      from: 'app', to: 'core', kind: 'call', label: 'confirm: chọn nguồn tiền + PIN',
      state: 'pending_payment',
      note: hold
        ? 'App gọi thẳng Core, team service không tham gia. Core hold 100k: tiền vẫn trong ví nhưng không xài được nữa.'
        : 'App gọi thẳng Core, team service không tham gia. Core chỉ có debit, nên 100k rời ví user ngay lúc này.',
      money: hold ? { user: '100k', userHeld: true, bill: 'chưa trả' } : { core: '100k', bill: 'chưa trả' },
      moneyMoves: hold ? 'hold' : 'user→core',
    },
    {
      from: 'core', to: 'app', kind: 'reply', label: 'payment result',
      state: 'pending_payment',
      note: 'User thấy kết quả trả tiền ngay. Còn team service thì vẫn chưa biết gì: đây chính là blind spot.',
      money: hold ? { user: '100k', userHeld: true, bill: 'chưa trả' } : { core: '100k', bill: 'chưa trả' },
    },
    {
      from: 'core', to: 'kafka', kind: 'event', label: 'publish "payment completed" (outbox)',
      state: 'pending_payment',
      note: 'Core ghi event vào outbox trong cùng DB transaction với lệnh hold/debit, rồi một publisher riêng đẩy lên Kafka. Publish có trục trặc thì event vẫn không mất.',
      money: hold ? { user: '100k', userHeld: true, bill: 'chưa trả' } : { core: '100k', bill: 'chưa trả' },
    },
    {
      from: 'kafka', to: 'service', kind: 'event', label: 'consume (upsert theo session ref)',
      state: 'partner_processing',
      note: 'Kafka là at-least-once, cùng một event có thể về nhiều lần. Consumer phải upsert theo session ref, đừng apply lại một cách mù quáng.',
      money: hold ? { user: '100k', userHeld: true, bill: 'chưa trả' } : { core: '100k', bill: 'chưa trả' },
    },
    {
      from: 'service', to: 'partner', kind: 'call', label: 'pay(bill_id)',
      state: 'partner_processing',
      note: 'Chỉ gọi partner sau khi Core xác nhận đã trả. Kèm idempotency key. Partner không bao giờ gọi Core, Core cũng không bao giờ gọi partner.',
      money: hold ? { user: '100k', userHeld: true, bill: 'đang xử lý' } : { core: '100k', bill: 'đang xử lý' },
    },
    hold
      ? {
        from: 'partner', to: 'service', kind: 'reply', label: 'success',
        state: 'partner_processing',
        note: 'Partner gạch nợ xong. Partner mà timeout thì trả cho user trạng thái "đang xử lý" và để reconciliation lo tiếp, đừng tự kết luận.',
        money: { user: '100k', userHeld: true, bill: 'đã trả' },
      }
      : {
        from: 'partner', to: 'service', kind: 'reply', label: 'success → no-op',
        state: 'success',
        note: 'Partner gạch nợ xong. Tiền đã debit từ trước nên không cần gọi Core nữa, chỉ đánh success. Nếu partner fail thì phải refund, và refund cũng cần retry như mọi external call khác.',
        money: { core: '100k', bill: 'đã trả' },
      },
  ];
  if (hold) {
    steps.push({
      from: 'service', to: 'core', kind: 'call', label: 'commit',
      state: 'success',
      note: 'Có kết quả của partner rồi mới finalize. Commit biến hold thành debit thật. Nếu partner fail thì gọi rollback để nhả hold.',
      money: { core: '100k', bill: 'đã trả' },
      moneyMoves: 'user→core',
    });
  }

  return {
    key: variant,
    initial: 'draft',
    success: 'success',
    title: hold ? 'Core có hold' : 'Core chỉ có debit',
    short: hold ? 'Hold' : 'Debit',
    summary: hold
      ? 'Core hỗ trợ hold: lúc user trả thì tiền chỉ bị giữ lại. Partner ok thì commit, partner fail thì rollback. Không có giao dịch nào phải hoàn.'
      : 'Core chỉ có debit: tiền rời ví ngay lúc user trả. Partner ok thì không cần làm gì thêm, partner fail thì phải refund. Refund là một external call nên cần idempotency và retry.',
    participants: PARTICIPANTS,
    buckets: BUCKETS,
    steps,
    states: STATES,
    transitions: TRANSITIONS,
    scenarios: SCENARIOS,
  };
}

export const BILLPAY_FLOWS = { hold: makeFlow('hold'), debit: makeFlow('debit') };

/** What the rest of the page leans on. */
export const BILLPAY_RULES = [
  { id: 'R1', title: 'Session → user trả → partner → finalize', body: 'Thứ tự này không bao giờ đảo. Tạo session không động vào tiền, và tiền chỉ đi khi user đã confirm ở payment screen.' },
  { id: 'R2', title: 'Không finalize trước khi partner trả lời', body: 'Commit hay rollback, no-op hay refund, đều phải đợi kết quả của partner. Partner timeout thì để status ở partner_processing.' },
  { id: 'R3', title: 'Status do team service giữ', body: 'Status đi theo response và event từ Core và partner, không bao giờ theo những gì client gửi lên.' },
  { id: 'R4', title: 'Duplicate guard bằng unique constraint', body: 'Đặt unique trên reference của chính partner (bill_id / order_id) trong bảng transactions. Không cần Redis lock.' },
  { id: 'R5', title: 'Idempotency key ở mọi call', body: 'Call sang Core, sang partner, và cả refund đều mang idempotency key.' },
];

export const RECON_STEPS = [
  { layer: 'Scheduler (~2s)', covers: 'Reset các retry_jobs bị kẹt ở processing về pending. Tạo retry_jobs cho những transaction quá timeout. Nếu số job pending vượt ngưỡng thì bỏ qua lượt đó (backpressure).' },
  { layer: 'Worker (~1s)', covers: 'Lấy job bằng SELECT … FOR UPDATE SKIP LOCKED, nên nhiều worker chạy song song mà không cần distributed lock.' },
  { layer: 'Hỏi cả hai phía', covers: 'Hỏi Core status thật của payment (phòng khi mất event Kafka), hỏi partner status thật của việc gạch nợ.' },
  { layer: 'Chốt', covers: 'Cập nhật transaction và job, commit / rollback / refund khi cần. Backoff 1s → 2s → 4s → 8s → 16s, hết lượt thì mark failed và báo user.' },
];

export const CLAIM_SQL = `-- Worker nhận việc, không cần distributed lock
SELECT id, tx_id, job_type
FROM retry_jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 50
FOR UPDATE SKIP LOCKED;`;

export const TABLES_SQL = `-- Chống trả một hoá đơn hai lần
ALTER TABLE transactions ADD UNIQUE (partner_ref);   -- bill_id / order_id

-- Mỗi transaction chỉ có một job cho mỗi loại việc
ALTER TABLE retry_jobs ADD UNIQUE (tx_id, job_type);

-- Index nhỏ: chỉ chứa các transaction chưa kết thúc
CREATE INDEX transactions_open_idx ON transactions (updated_at)
WHERE status IN ('pending_payment', 'partner_processing');`;

export const CHECKLIST = [
  'Dùng lại status lifecycle ở trên',
  'Payment screen là component của Core: app gọi thẳng Core, không đi qua team service',
  'Core có outbox + Kafka event "payment completed"; consumer idempotent (upsert theo ref)',
  'Reconciliation hỏi cả Core lẫn partner, không chỉ partner',
  'Session → user trả → partner → finalize, không bao giờ đảo',
  'Unique constraint trên bill/order reference của partner',
  'Idempotency key cho mọi call sang Core, partner và refund',
  'Bảng retry_jobs riêng + scheduler (backpressure) + workers (SKIP LOCKED) + exponential backoff',
  'Partial index cho các status chưa kết thúc',
  'Mỗi feature có timeout riêng; có kế hoạch partition khi volume lớn',
];
