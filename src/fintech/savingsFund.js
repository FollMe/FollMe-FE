/**
 * Savings fund: the wallet sends user money to a partner-managed fund to earn
 * interest, and brings it back. The wallet orchestrates; the partner owns the
 * money and the interest.
 *
 * Everything the page draws (sequence, money map, state machine, scenarios)
 * comes from this file. util/stateMachine.test.js checks that every scenario
 * and every sequence step follows the transitions declared here.
 */

/** Who acts next on a state. Drives the colour of a node. */
export const ACTORS = {
  user: 'User',
  us: 'Service (mình)',
  wallet: 'Wallet core',
  partner: 'Partner',
  bank: 'Bank / payout rail',
  ops: 'Ops',
};

const DEPOSIT = {
  key: 'deposit',
  title: 'Nộp tiền vào quỹ',
  short: 'Nộp',
  summary: 'User chuyển tiền từ ví sang quỹ của partner. Lúc nhập PIN tiền mới chỉ bị hold, phải đợi partner đồng ý nhận thì tiền mới thật sự đi.',

  participants: [
    { id: 'app', label: 'App', role: 'User bấm nộp, nhập PIN' },
    { id: 'service', label: 'Service', role: 'Orchestrator, giữ order và state. Không phải ledger' },
    { id: 'wallet', label: 'Wallet core', role: 'Ledger của ví: hold, debit, refund' },
    { id: 'partner', label: 'Partner', role: 'Quỹ, source of truth cho units và lãi' },
    { id: 'rail', label: 'Payout rail', role: 'Đẩy tiền từ pocket sang bank của partner' },
  ],

  buckets: [
    { id: 'user', label: 'Ví user' },
    { id: 'pocket', label: 'Pocket của partner', hint: 'merchant wallet trên ledger ví' },
    { id: 'pbank', label: 'Bank partner', hint: 'tiền thật' },
    { id: 'units', label: 'Units ở quỹ' },
  ],

  // One arrow per step. `state` is our order status after the step,
  // `money` where the 100k sits after it.
  steps: [
    {
      from: 'app', to: 'service', kind: 'call', label: 'deposit request (request_id)',
      state: 'ORDER_RECEIVED',
      note: 'Check local trước cho rẻ: idempotency, trạng thái account, số dư. Rồi INSERT order kèm order_ref (UUIDv7) trước khi gọi bất kỳ ai. Write before you call.',
      money: { user: '100k' },
    },
    {
      from: 'service', to: 'wallet', kind: 'call', label: 'tạo async order (order_ref)',
      state: 'ORDER_CREATED',
      note: 'Đây là async order nên PIN chỉ hold tiền, chưa debit. order_ref là key duy nhất mình gửi cho mọi hệ thống.',
      money: { user: '100k' },
    },
    {
      from: 'app', to: 'wallet', kind: 'call', label: 'confirm + PIN',
      state: 'ORDER_CREATED',
      note: 'User nhập PIN thẳng với wallet core. Tiền bị hold: available balance giảm, nhưng tiền vẫn nằm trong ví user.',
      money: { user: '100k', userHeld: true },
      moneyMoves: 'hold',
    },
    {
      from: 'wallet', to: 'service', kind: 'event', label: 'event: held',
      state: 'WALLET_HELD',
      note: 'Chỉ đi tiếp khi chắc chắn đã hold. Event PENDING hay event lạ thì log lại, không advance.',
      money: { user: '100k', userHeld: true },
    },
    {
      from: 'service', to: 'partner', kind: 'call', label: 'reserve units',
      state: 'WALLET_HELD',
      note: 'Hỏi partner trước khi động vào tiền. Partner tự enforce limit ở bước này, ví dụ max balance.',
      money: { user: '100k', userHeld: true },
    },
    {
      from: 'partner', to: 'service', kind: 'reply', label: 'reserved (pending)',
      state: 'PARTNER_RESERVED',
      note: 'Nếu partner từ chối ở đây thì mình chỉ cần release hold, không phải refund. Mình chọn thứ tự hold → reserve → debit chính vì chỗ này.',
      money: { user: '100k', userHeld: true, units: 'pending' },
    },
    {
      from: 'service', to: 'wallet', kind: 'call', label: 'update status SUCCESS → debit',
      state: 'WALLET_DEBITED',
      note: 'Tới đây tiền mới thật sự di chuyển, từ ví user sang pocket của partner. Phải debit trước payout, vì payout lấy tiền từ pocket.',
      money: { pocket: '100k', units: 'pending' },
      moneyMoves: 'user→pocket',
    },
    {
      from: 'service', to: 'rail', kind: 'call', label: 'payout → bank partner',
      state: 'PAYOUT_REQUESTED',
      note: 'Một merchant payout bình thường, idempotent theo order_ref. Timeout ở đây thì inquiry, tuyệt đối đừng refund.',
      money: { pocket: '100k', units: 'pending' },
    },
    {
      from: 'rail', to: 'service', kind: 'event', label: 'bank success + bank_ref',
      state: 'PAYOUT_SUCCEEDED',
      note: 'Bank là source of truth cho tiền mặt. Bank báo success nghĩa là tiền đã nằm ở tài khoản của partner.',
      money: { pbank: '100k', units: 'pending' },
      moneyMoves: 'pocket→pbank',
    },
    {
      from: 'service', to: 'partner', kind: 'call', label: 'confirm (bank_ref)',
      state: 'PAYOUT_SUCCEEDED',
      note: 'Đưa bank_ref cho partner để chốt units. Confirm và cancel loại trừ nhau, chỉ một cái thắng.',
      money: { pbank: '100k', units: 'pending' },
    },
    {
      from: 'partner', to: 'service', kind: 'reply', label: 'ack (sync)',
      state: 'PAYOUT_SUCCEEDED',
      note: 'Response sync chỉ có nghĩa là partner đã nhận yêu cầu. Kết quả cuối sẽ về qua callback.',
      money: { pbank: '100k', units: 'pending' },
    },
    {
      from: 'partner', to: 'service', kind: 'callback', label: 'callback: units final',
      state: 'COMPLETED',
      note: 'Lúc này user mới thấy "thành công", vì số dư tiết kiệm đã tăng thật. Reply success cho callback chỉ sau khi transition đã commit.',
      money: { pbank: '100k', units: 'final' },
    },
  ],

  states: [
    { id: 'ORDER_RECEIVED', col: 1, row: 0, actor: 'us', meaning: 'Row của mình đã có; wallet order có thể có hoặc chưa', money: 'chưa động tới', deadline: 'Đánh FAILED (bỏ dở). Chỉ là dọn dẹp' },
    { id: 'ORDER_CREATED', col: 1, row: 1, actor: 'user', meaning: 'Wallet order đã có, chưa nhập PIN', money: 'chưa động tới', deadline: 'Cancel wallet order: ok → FAILED; bị từ chối vì đã hold → WALLET_HELD; timeout → retry. Deadline phải dài hơn timeout của màn hình thanh toán' },
    { id: 'WALLET_HELD', col: 1, row: 2, actor: 'us', meaning: 'Tiền user đang bị hold', money: 'hold trong ví user', deadline: 'Hỏi partner đã reserve chưa: rồi → PARTNER_RESERVED; chưa → release → FAILED' },
    { id: 'PARTNER_RESERVED', col: 1, row: 3, actor: 'us', meaning: 'Partner giữ units pending', money: 'hold trong ví user', deadline: 'Retry update status (idempotent)' },
    { id: 'WALLET_DEBITED', col: 1, row: 4, actor: 'us', meaning: 'Tiền đã vào pocket', money: 'pocket', deadline: 'Hỏi payout rail theo order_ref: đã gửi → PAYOUT_REQUESTED; chưa → gửi' },
    { id: 'PAYOUT_REQUESTED', col: 1, row: 5, actor: 'bank', meaning: 'Đã gửi payout, chờ kết quả', money: 'đang rời pocket', deadline: 'Inquiry payout rail' },
    { id: 'PAYOUT_SUCCEEDED', col: 1, row: 6, actor: 'partner', meaning: 'Tiền mặt đã ở bank partner', money: 'bank partner', deadline: 'Gửi lại confirm (idempotent); vẫn không có callback → inquiry partner; hết budget → flag + alert' },
    { id: 'COMPLETED', col: 1, row: 7.4, terminal: 'ok', meaning: 'Units đã chốt', money: 'ở partner' },
    { id: 'FAILED', col: 2, row: 1.5, terminal: 'fail', meaning: 'Chưa có gì di chuyển / hold đã release', money: 'ví user' },
    { id: 'PAYOUT_FAILED', col: 2, row: 6, actor: 'us', meaning: 'Bank từ chối, tiền chưa rời khỏi pocket', money: 'pocket', deadline: 'Retry cancel partner → flag + alert' },
    { id: 'PARTNER_CANCELLED', col: 2, row: 7, actor: 'us', meaning: 'Partner đã ack cancel', money: 'pocket', deadline: 'Gửi refund (idempotent)' },
    { id: 'REFUND_REQUESTED', col: 2, row: 8.2, actor: 'wallet', meaning: 'Đã gửi refund, chờ kết quả', money: 'pocket → ví user', deadline: 'Inquiry, gửi lại → flag + alert' },
    { id: 'REFUNDED', col: 2, row: 9.2, terminal: 'ok', meaning: 'Tiền đã về lại user', money: 'ví user' },
    { id: 'DISPUTED', col: 0, row: 8.2, actor: 'ops', meaning: 'Partner báo ERROR nhưng bank nói tiền đã tới', money: 'bank partner', deadline: 'Escalate theo SLA' },
  ],

  transitions: [
    ['ORDER_RECEIVED', 'ORDER_CREATED', 'wallet order đã tạo'],
    ['ORDER_RECEIVED', 'FAILED', 'wallet từ chối / bỏ dở'],
    ['ORDER_CREATED', 'WALLET_HELD', 'PIN ok'],
    ['ORDER_CREATED', 'FAILED', 'huỷ PIN / thiếu tiền / bỏ dở'],
    ['WALLET_HELD', 'PARTNER_RESERVED', 'partner ok'],
    ['WALLET_HELD', 'FAILED', 'partner từ chối → release'],
    ['PARTNER_RESERVED', 'WALLET_DEBITED', 'update status SUCCESS'],
    ['WALLET_DEBITED', 'PAYOUT_REQUESTED', 'đã gửi payout'],
    ['WALLET_DEBITED', 'PAYOUT_SUCCEEDED', 'bank success (event về sớm)', -240],
    ['WALLET_DEBITED', 'PAYOUT_FAILED', 'bank fail dứt khoát (event về sớm)', -40],
    ['PAYOUT_REQUESTED', 'PAYOUT_SUCCEEDED', 'bank success'],
    ['PAYOUT_REQUESTED', 'PAYOUT_FAILED', 'bank fail dứt khoát'],
    ['PAYOUT_SUCCEEDED', 'COMPLETED', 'partner callback SUCCESS'],
    ['PAYOUT_SUCCEEDED', 'DISPUTED', 'partner ERROR, tiền đã đi'],
    ['PAYOUT_FAILED', 'PARTNER_CANCELLED', 'partner ack cancel'],
    ['PARTNER_CANCELLED', 'REFUND_REQUESTED', 'đã gửi refund'],
    ['REFUND_REQUESTED', 'REFUNDED', 'refund xác nhận'],
    ['DISPUTED', 'COMPLETED', 'partner phát hành units'],
    ['DISPUTED', 'REFUND_REQUESTED', 'tiền đã được trả về', 30],
  ],

  scenarios: [
    {
      id: 'happy',
      label: 'Happy path',
      path: [
        ['ORDER_RECEIVED', 'Request tới, INSERT order trước khi gọi ai.'],
        ['ORDER_CREATED', 'Wallet tạo async order.'],
        ['WALLET_HELD', 'User nhập PIN, tiền bị hold.'],
        ['PARTNER_RESERVED', 'Partner nhận reserve units.'],
        ['WALLET_DEBITED', 'Debit: ví user → pocket.'],
        ['PAYOUT_REQUESTED', 'Gửi payout sang bank partner.'],
        ['PAYOUT_SUCCEEDED', 'Bank báo tiền đã tới.'],
        ['COMPLETED', 'Partner callback units final.'],
      ],
    },
    {
      id: 'abandon',
      label: 'User bỏ PIN',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo, app hiện màn hình PIN.'],
        ['FAILED', 'User thoát ra. Hết deadline, worker cancel wallet order thành công → FAILED. Tiền chưa đi đâu nên không có gì phải undo.'],
      ],
    },
    {
      id: 'partner-reject',
      label: 'Partner từ chối',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo.'],
        ['WALLET_HELD', 'PIN ok, tiền bị hold.'],
        ['FAILED', 'Partner từ chối vì vượt max balance. Chỉ cần release hold, không phát sinh refund nào có thể fail.'],
      ],
    },
    {
      id: 'payout-fail',
      label: 'Payout fail → compensation',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo.'],
        ['WALLET_HELD', 'PIN ok.'],
        ['PARTNER_RESERVED', 'Partner reserve.'],
        ['WALLET_DEBITED', 'Tiền đã vào pocket.'],
        ['PAYOUT_REQUESTED', 'Gửi payout.'],
        ['PAYOUT_FAILED', 'Bank từ chối dứt khoát: tiền chưa rời pocket.'],
        ['PARTNER_CANCELLED', 'Cancel phía partner trước và chờ ack sync. Hai bên thống nhất rồi mới trả tiền.'],
        ['REFUND_REQUESTED', 'Lúc này phải refund chứ không release được nữa, vì hold đã bị debit. Key là refund-{order_ref}.'],
        ['REFUNDED', 'Tiền về lại ví user. Lịch sử ví hiện một dòng refund riêng.'],
      ],
    },
    {
      id: 'dispute',
      label: 'Partner ERROR sau khi tiền đã đi',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo.'],
        ['WALLET_HELD', 'PIN ok.'],
        ['PARTNER_RESERVED', 'Partner reserve.'],
        ['WALLET_DEBITED', 'Tiền vào pocket.'],
        ['PAYOUT_REQUESTED', 'Gửi payout.'],
        ['PAYOUT_SUCCEEDED', 'Bank: tiền đã tới partner.'],
        ['DISPUTED', 'Partner callback ERROR, nhưng tiền đã rời khỏi mình nên không được refund ngay. Hai source of truth đang nói ngược nhau, đẩy cho ops.'],
        ['REFUND_REQUESTED', 'Partner trả tiền về pocket. Chỉ khi đó mới refund user.'],
        ['REFUNDED', 'Xong. Never refund money you can\'t prove you still have.'],
      ],
    },
    {
      id: 'early-event',
      label: 'Event bank về sớm',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo.'],
        ['WALLET_HELD', 'PIN ok.'],
        ['PARTNER_RESERVED', 'Partner reserve.'],
        ['WALLET_DEBITED', 'Gọi payout xong nhưng chưa kịp ghi PAYOUT_REQUESTED.'],
        ['PAYOUT_SUCCEEDED', 'Event SUCCESS tới trước. Cứ nhận luôn từ WALLET_DEBITED, vì có kết quả tức là payout đã được gửi. Lệnh CAS sang PAYOUT_REQUESTED tới sau sẽ trả 0 row, thành no-op.'],
        ['COMPLETED', 'Partner callback units final.'],
      ],
    },
  ],
};

const WITHDRAW = {
  key: 'withdraw',
  title: 'Rút tiền từ quỹ',
  short: 'Rút',
  summary: 'User rút tiền từ quỹ về ví. Partner tự chuyển tiền sang, còn mình chỉ credit cho user khi bank đã xác nhận tiền tới. Lời partner thôi là chưa đủ.',

  participants: [
    { id: 'app', label: 'App', role: 'User bấm rút, nhập PIN' },
    { id: 'service', label: 'Service', role: 'Orchestrator, giữ order và state' },
    { id: 'wallet', label: 'Wallet core', role: 'Ledger: cash-in vào pocket, credit user' },
    { id: 'partner', label: 'Partner', role: 'Quỹ: lock units, trừ units, tự chuyển tiền' },
    { id: 'bank', label: 'Bank', role: 'Source of truth cho tiền mặt' },
  ],

  buckets: [
    { id: 'units', label: 'Units ở quỹ' },
    { id: 'wbank', label: 'Bank của ví', hint: 'đã tới, chưa vào ledger' },
    { id: 'pocket', label: 'Pocket của partner', hint: 'merchant wallet trên ledger ví' },
    { id: 'user', label: 'Ví user' },
  ],

  steps: [
    {
      from: 'app', to: 'service', kind: 'call', label: 'withdraw request (request_id)',
      state: 'ORDER_RECEIVED',
      note: 'Giống luồng nộp: check local, rồi INSERT order kèm order_ref trước khi gọi ai.',
      money: { units: '100k' },
    },
    {
      from: 'service', to: 'wallet', kind: 'call', label: 'tạo async order (order_ref)',
      state: 'ORDER_CREATED',
      note: 'Wallet order chỉ được update ở bước cuối (credit hoặc close), nên lịch sử ví luôn khớp với status của mình.',
      money: { units: '100k' },
    },
    {
      from: 'app', to: 'wallet', kind: 'call', label: 'confirm + PIN',
      state: 'ORDER_CREATED',
      note: 'Ở luồng rút, PIN chỉ là authorize. Không hold gì, cũng chưa có gì di chuyển.',
      money: { units: '100k' },
    },
    {
      from: 'wallet', to: 'service', kind: 'event', label: 'event: authorized',
      state: 'WALLET_AUTHORIZED',
      note: 'User đã xác nhận, nên từ đây mình có trách nhiệm làm cho xong cái user đã confirm.',
      money: { units: '100k' },
    },
    {
      from: 'service', to: 'partner', kind: 'call', label: 'withdraw (order_ref)',
      state: 'WALLET_AUTHORIZED',
      note: 'Chỉ một call. Partner tự check số dư và withdraw limit, rồi lock units ở phía họ.',
      money: { units: '100k' },
    },
    {
      from: 'partner', to: 'service', kind: 'reply', label: 'ack (processing)',
      state: 'PARTNER_REQUESTED',
      note: 'Units đã bị lock, không còn tính vào số dư. Timeout ở bước này thì inquiry. Đừng bao giờ fail chỉ vì bên kia im lặng.',
      money: { units: '100k', unitsLocked: true },
    },
    {
      from: 'partner', to: 'bank', kind: 'money', label: 'chuyển → tài khoản bank của ví',
      state: 'PARTNER_REQUESTED',
      note: 'Partner là người giữ tiền nên họ tự đẩy tiền đi. Mình không có debit mandate trên tài khoản của họ.',
      money: { wbank: '100k' },
      moneyMoves: 'units→wbank',
    },
    {
      from: 'partner', to: 'service', kind: 'callback', label: 'callback: sent (fundTransferId)',
      state: 'PARTNER_SENT',
      note: '"Sent" nghĩa là units đã bị trừ và tiền đã chuyển. Lưu fundTransferId với UNIQUE, để một lệnh chuyển chỉ ứng với đúng một order.',
      money: { wbank: '100k' },
    },
    {
      from: 'service', to: 'wallet', kind: 'call', label: 'cash-in (fundTransferId)',
      state: 'PARTNER_SENT',
      note: 'Key là cashin-{order_ref}. Partner nói "đã gửi" thì chưa đủ để ghi vào ledger.',
      money: { wbank: '100k' },
    },
    {
      from: 'wallet', to: 'bank', kind: 'call', label: 'verify tiền đã tới',
      state: 'PARTNER_SENT',
      note: 'Check theo fundTransferId: đúng số tiền, đúng tài khoản nhận. Chưa thấy thì check lại, có backoff.',
      money: { wbank: '100k' },
    },
    {
      from: 'wallet', to: 'service', kind: 'reply', label: 'pocket credited',
      state: 'POCKET_CREDITED',
      note: 'Bank đã xác nhận và tiền đã vào ledger. Từ đây các bước còn lại đều là của mình và retry được.',
      money: { pocket: '100k' },
      moneyMoves: 'wbank→pocket',
    },
    {
      from: 'service', to: 'wallet', kind: 'call', label: 'update status SUCCESS → credit',
      state: 'COMPLETED',
      note: 'Chuyển từ pocket sang ví user. Nếu fail, ví dụ ví đang bị khoá, thì retry rồi flag. Tiền vẫn nằm yên ở pocket, không mất đi đâu.',
      money: { user: '100k' },
      moneyMoves: 'pocket→user',
    },
  ],

  states: [
    { id: 'ORDER_RECEIVED', col: 1, row: 0, actor: 'us', meaning: 'Row của mình đã có; wallet order có thể có hoặc chưa', money: 'ở partner', deadline: 'Đánh FAILED (bỏ dở), chỉ là dọn dẹp' },
    { id: 'ORDER_CREATED', col: 1, row: 1, actor: 'user', meaning: 'Wallet order đã có, chưa nhập PIN', money: 'ở partner', deadline: 'Cancel wallet order: ok → FAILED; bị từ chối vì đã authorize → WALLET_AUTHORIZED; timeout → retry' },
    { id: 'WALLET_AUTHORIZED', col: 1, row: 2, actor: 'us', meaning: 'User đã xác nhận; không có gì bị hold', money: 'ở partner', deadline: 'Inquiry partner theo order_ref: có → áp state đó; không có → gửi withdraw (idempotent); không trả lời → retry → flag + alert' },
    { id: 'PARTNER_REQUESTED', col: 1, row: 3, actor: 'partner', meaning: 'Partner đã nhận, chờ kết quả', money: 'ở partner (units bị lock)', deadline: 'Inquiry partner: sent → PARTNER_SENT; failed → PARTNER_FAILED; processing hay im lặng → retry → flag. Không bao giờ fail chỉ vì im lặng' },
    { id: 'PARTNER_SENT', col: 1, row: 4, actor: 'us', meaning: 'Units đã trừ, tiền đã chuyển; đã lưu fundTransferId', money: 'bank của ví, chưa vào ledger', deadline: 'Check bank theo fundTransferId: tới + đúng số → cash-in; chưa → re-check backoff; hết budget hoặc lệch số → DISPUTED' },
    { id: 'POCKET_CREDITED', col: 1, row: 5, actor: 'us', meaning: 'Bank đã xác nhận, tiền đã vào ledger', money: 'pocket', deadline: 'Update status SUCCESS (idempotent); hết budget → flag + alert, tiền nằm ở pocket' },
    { id: 'COMPLETED', col: 1, row: 6.2, terminal: 'ok', meaning: 'Ví user đã được cộng', money: 'ví user' },
    { id: 'FAILED', col: 2, row: 1.5, terminal: 'fail', meaning: 'Wallet order đã đóng, không có gì di chuyển', money: 'ở partner' },
    { id: 'PARTNER_FAILED', col: 2, row: 3, actor: 'us', meaning: 'Partner fail dứt khoát, units đã được trả lại', money: 'ở partner', deadline: 'Update status FAILED (idempotent) → FAILED; retry → flag + alert' },
    { id: 'DISPUTED', col: 2, row: 5, actor: 'ops', meaning: 'Partner nói đã gửi, bank không thấy', money: 'không rõ', deadline: 'Escalate theo SLA' },
  ],

  transitions: [
    ['ORDER_RECEIVED', 'ORDER_CREATED', 'wallet order đã tạo'],
    ['ORDER_RECEIVED', 'FAILED', 'wallet từ chối / bỏ dở'],
    ['ORDER_CREATED', 'WALLET_AUTHORIZED', 'PIN ok'],
    ['ORDER_CREATED', 'FAILED', 'huỷ PIN / bỏ dở'],
    ['WALLET_AUTHORIZED', 'PARTNER_REQUESTED', 'partner ack'],
    ['WALLET_AUTHORIZED', 'PARTNER_SENT', 'sent (callback về sớm)', -240],
    ['WALLET_AUTHORIZED', 'PARTNER_FAILED', 'partner từ chối / failed sớm'],
    ['PARTNER_REQUESTED', 'PARTNER_SENT', 'callback sent'],
    ['PARTNER_REQUESTED', 'PARTNER_FAILED', 'callback failed'],
    ['PARTNER_SENT', 'POCKET_CREDITED', 'bank xác nhận + cash-in ok'],
    ['PARTNER_SENT', 'DISPUTED', 'bank không thấy tiền / lệch số'],
    ['PARTNER_FAILED', 'FAILED', 'đóng wallet order'],
    ['POCKET_CREDITED', 'COMPLETED', 'đã credit ví user'],
    ['DISPUTED', 'POCKET_CREDITED', 'tìm thấy tiền', -20],
    ['DISPUTED', 'PARTNER_FAILED', 'partner trả lại units'],
  ],

  scenarios: [
    {
      id: 'happy',
      label: 'Happy path',
      path: [
        ['ORDER_RECEIVED', 'Request tới, INSERT order trước.'],
        ['ORDER_CREATED', 'Wallet tạo async order.'],
        ['WALLET_AUTHORIZED', 'User nhập PIN: chỉ authorize.'],
        ['PARTNER_REQUESTED', 'Partner ack, lock units.'],
        ['PARTNER_SENT', 'Partner chuyển tiền, callback kèm fundTransferId.'],
        ['POCKET_CREDITED', 'Bank xác nhận tiền tới, cash-in vào pocket.'],
        ['COMPLETED', 'Credit ví user.'],
      ],
    },
    {
      id: 'partner-reject',
      label: 'Partner từ chối',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo.'],
        ['WALLET_AUTHORIZED', 'PIN ok.'],
        ['PARTNER_FAILED', 'Partner từ chối vì vượt withdraw limit. Units vẫn còn nguyên.'],
        ['FAILED', 'Đóng wallet order là xong. Không cần compensation, vì bên mình chưa có gì di chuyển.'],
      ],
    },
    {
      id: 'no-cash',
      label: 'Partner báo sent, bank chưa thấy',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo.'],
        ['WALLET_AUTHORIZED', 'PIN ok.'],
        ['PARTNER_REQUESTED', 'Partner ack.'],
        ['PARTNER_SENT', 'Partner callback "sent", nhưng bank chưa thấy tiền. Check lại, có backoff.'],
        ['DISPUTED', 'Hết retry budget mà vẫn không thấy tiền. Không credit user chỉ dựa trên lời partner. Trong lúc đó user vẫn thấy "Đang xử lý".'],
        ['POCKET_CREDITED', 'Ops tìm ra lệnh chuyển, hoá ra bank xử lý chậm. Cash-in.'],
        ['COMPLETED', 'Credit ví user.'],
      ],
    },
    {
      id: 'early-callback',
      label: 'Callback về trước ack',
      path: [
        ['ORDER_RECEIVED', 'Request tới.'],
        ['ORDER_CREATED', 'Wallet order đã tạo.'],
        ['WALLET_AUTHORIZED', 'Gọi withdraw xong nhưng chưa kịp ghi PARTNER_REQUESTED.'],
        ['PARTNER_SENT', 'Callback "sent" tới trước. Cứ nhận từ WALLET_AUTHORIZED; lệnh CAS ghi PARTNER_REQUESTED tới sau sẽ trả 0 row, thành no-op.'],
        ['POCKET_CREDITED', 'Bank xác nhận, cash-in.'],
        ['COMPLETED', 'Credit ví user.'],
      ],
    },
  ],
};

export const FLOWS = { deposit: DEPOSIT, withdraw: WITHDRAW };

/** Rules that hold on every step of both flows. */
export const INVARIANTS = [
  { id: 'I1', title: 'Money is conserved', body: 'Tiền không tự sinh ra hay mất đi. Có debit thì cuối cùng phải có một credit hoặc một refund.' },
  { id: 'I2', title: 'Write before you call', body: 'Lưu intent (order + order_ref) vào DB trước mọi external call. Lỡ crash giữa chừng thì vẫn biết mình đang định làm gì.' },
  { id: 'I3', title: 'Every external call is idempotent', body: 'Key là order_ref của mình. Retry thì gửi lại đúng key cũ, bên nhận lo phần dedup.' },
  { id: 'I4', title: 'Timeout ≠ failure', body: 'Không rõ kết quả thì inquiry, đừng undo. Refund ngay sau một payout timeout là cách nhanh nhất để mất tiền hai lần.' },
  { id: 'I5', title: 'Every waiting state has an owner and a deadline', body: 'Hết retry thì flag và alert. Không có order nào được phép kẹt trong im lặng.' },
  { id: 'W-I1', title: 'Credit only cash the bank has confirmed', body: 'Riêng cho luồng rút: partner nói "đã gửi" thì vẫn chưa đủ.' },
];

/** The decisions worth explaining to someone reading the flow for the first time. */
export const DECISIONS = [
  {
    flow: 'deposit',
    topic: 'Thứ tự các bước',
    options: 'debit → reserve → payout · reserve → PIN → payout · hold → reserve → debit → payout',
    pick: 'hold → reserve → debit → payout',
    why: 'Partner từ chối thì chỉ cần release hold, không mất gì. Cách này cũng không đòi partner có tính năng gì đặc biệt, chỉ cần wallet core hỗ trợ async order.',
  },
  {
    flow: 'deposit',
    topic: 'Lúc nhập PIN thì debit hay hold?',
    options: 'debit · hold',
    pick: 'hold',
    why: 'Undo một hold chỉ là release. Undo một debit là refund, tức là một giao dịch mới, và giao dịch đó cũng có thể fail.',
  },
  {
    flow: 'deposit',
    topic: 'Hold có TTL tự release không?',
    options: 'TTL auto-release · không TTL + deadline của order',
    pick: 'không TTL + deadline',
    why: 'Auto-release sẽ đua với một partner chậm: tiền đã release mà partner vẫn reserve. Deadline thì khác, tới hạn worker hỏi trước rồi mới quyết.',
  },
  {
    flow: 'both',
    topic: 'Ai quyết định status cuối?',
    options: 'chỉ partner · hai source of truth',
    pick: 'hai source of truth',
    why: 'Bank là source of truth cho tiền mặt, partner là source of truth cho units. Hai bên nói ngược nhau thì vào DISPUTED, không đoán mò.',
  },
  {
    flow: 'both',
    topic: 'Concurrency guard',
    options: 'Redis lock · DB compare-and-set',
    pick: 'DB compare-and-set',
    why: 'Lock có thể hết hạn giữa chừng. Còn CAS trên status giải quyết luôn replay, race và idempotency chỉ trong một câu UPDATE.',
  },
  {
    flow: 'both',
    topic: 'Lưu state',
    options: 'một cột status · step + status · event log',
    pick: 'status + bảng history append-only',
    why: 'State sai không thể tồn tại, lại có audit trail đầy đủ. Hai bảng được ghi trong cùng một transaction.',
  },
  {
    flow: 'withdraw',
    topic: 'Ai khởi động việc chuyển tiền?',
    options: 'mình pull (debit mandate) · partner push',
    pick: 'partner push',
    why: 'Ai giữ tiền thì người đó tự điều khiển tài khoản của mình, không cần mandate.',
  },
  {
    flow: 'withdraw',
    topic: 'Partner báo "failed" có cần check bank?',
    options: 'verify với bank · tin partner',
    pick: 'tin partner',
    why: 'Nếu partner báo "failed" sai thì người thiệt là partner: tiền tới mà mình không credit. Reconciliation cuối ngày sẽ bắt được.',
  },
];

/** What each layer of recovery catches, from fastest to slowest. */
export const RECOVERY = [
  { layer: 'Event', covers: 'Đường chính và nhanh nhất. Bên gửi dùng outbox.' },
  { layer: 'Read-repair', covers: 'App poll status mà thấy order bị trễ thì inquiry ngay trong request đó. Giao dịch được resolve ngay lúc user đang nhìn.' },
  { layer: 'Deadline worker', covers: 'Lo các ca event bị mất, call không rõ kết quả, service crash. Luôn hỏi trước rồi mới làm, retry có backoff.' },
  { layer: 'Flag + alert', covers: 'Những gì worker không tự sửa được. Order giữ nguyên status thật, chỉ set needs_manual và manual_reason.' },
  { layer: 'Reconciliation hằng ngày', covers: 'Bắt những order mà chính state của mình bị sai, bằng cách so orders với ledger, pocket, bank và partner.' },
];

export const CAS_SQL = `UPDATE orders
SET status = 'WALLET_DEBITED', version = version + 1
WHERE id = $1 AND status = 'PARTNER_RESERVED';
-- 0 rows → order đã đi tiếp rồi (replay / race) → no-op`;

export const INSERT_SQL = `INSERT INTO orders (order_ref, flow, user_id, request_id, amount, status)
VALUES ($1, 'deposit', $2, $3, $4, 'ORDER_RECEIVED')   -- $1 = UUIDv7
ON CONFLICT (user_id, request_id) DO NOTHING
RETURNING id;
-- có row   → gọi wallet với merchantOrderID = order_ref
-- không row → reject "request_id đã dùng", không gọi wallet`;
