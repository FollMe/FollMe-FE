/**
 * The "Bối cảnh" block of each fintech article: what the user sees, what
 * happens behind it, and the terms the article leans on.
 */

export const MONEY_MOVEMENT_CONTEXT = {
  phone: {
    title: 'Ví của bạn',
    rows: [
      { label: 'Số dư ví', value: '0đ', big: true },
      { label: 'Nguồn tiền', value: 'Tài khoản ngân hàng' },
    ],
    action: 'Nạp 100.000đ',
    after: [
      { label: 'Số dư ví', value: '100.000đ', big: true, good: true },
      { label: 'Nạp tiền thành công', value: 'vừa xong' },
    ],
    doneLabel: 'Nạp thành công',
  },
  scene: 'Bạn nạp 100k từ ngân hàng vào ví, và số dư trên app tăng ngay lập tức. Nhưng 100k tiền thật lúc đó đang nằm ở đâu, và ai đang giữ nó?',
  points: [
    { q: 'Bạn gặp nó ở đâu', a: 'Ở mọi thao tác có tiền trong một ví điện tử: nạp, rút, chuyển tiền, trả hoá đơn, gửi tiết kiệm, mua trả sau. Bài này không nói về một tính năng cụ thể, mà về luật chung mà tính năng nào cũng phải theo.' },
    { q: 'Phía sau có chuyện gì', a: 'Mỗi thao tác chạm vào hai thứ: con số trên ledger của ví, tức thứ user nhìn thấy, và tiền thật trong tài khoản ngân hàng của công ty ví. Hai thứ này không cập nhật cùng lúc, mà luật lại bắt chúng phải luôn khớp theo một chiều.' },
    { q: 'Đọc xong bạn có gì', a: 'Một khung để đọc mọi flow khác: bước này chạm layer nào, tiền thật đang ở đâu, và vì sao lại có những luật như "timeout không có nghĩa là fail". Nên đọc bài này trước bài Savings Fund và Billpay.' },
  ],
  glossary: [
    { term: 'ledger', def: 'Sổ cái của ví. Mỗi ví user hay merchant là một dòng, cập nhật tức thì. Đây là thứ user nhìn thấy.' },
    { term: 'liability', def: 'Số tiền ví đang "nợ" người dùng, bằng tổng số dư của mọi ví. Ví giữ hộ chứ không sở hữu.' },
    { term: 'safeguarding account', def: 'Tài khoản đảm bảo thanh toán của công ty ví ở ngân hàng, chứa tiền thật để back cho mọi số dư ví.' },
    { term: 'pocket', def: 'Ví của một merchant hay partner trên ledger. Cũng là liability như ví user.' },
    { term: 'settlement', def: 'Lúc tiền thật được chuyển giữa các tài khoản ngân hàng để khớp với những gì ledger đã ghi.' },
    { term: 'netting', def: 'Cộng trừ nhiều giao dịch lại để chỉ chuyển một lệnh duy nhất cho phần chênh.' },
  ],
};

export const SAVINGS_FUND_CONTEXT = {
  phone: {
    title: 'Tiết kiệm sinh lời',
    rows: [
      { label: 'Số dư tiết kiệm', value: '1.000.000đ', big: true },
      { label: 'Lãi hôm nay', value: '+150đ' },
      { label: 'Rút về ví', value: 'bất cứ lúc nào' },
    ],
    action: 'Gửi thêm 100.000đ',
    after: [
      { label: 'Số dư tiết kiệm', value: '1.100.000đ', big: true, good: true },
      { label: 'Lãi hôm nay', value: '+150đ' },
      { label: 'Gửi tiết kiệm', value: 'thành công' },
    ],
    doneLabel: 'Gửi thành công',
  },
  scene: 'Trong ví có mục "Tiết kiệm sinh lời": gửi bao nhiêu cũng được, ngày nào cũng có lãi, cần thì rút về ví ngay. Bạn bấm gửi 100k, vài giây sau app báo thành công.',
  points: [
    { q: 'Bạn gặp nó ở đâu', a: 'Ở các tính năng gửi tiết kiệm hay tích luỹ sinh lời trong ví điện tử. Ví không tự giữ tiền và trả lãi. Ví chuyển tiền sang một quỹ do partner quản lý, thường là một công ty quản lý quỹ, và partner mới là bên giữ tiền, tính lãi.' },
    { q: 'Phía sau có chuyện gì', a: 'Trong vài giây đó, tiền đi qua ba chỗ: ví của bạn, pocket của partner trên ví, rồi tài khoản ngân hàng của partner. Partner còn phải ghi nhận units cho bạn. Bên nào cũng có thể chậm, timeout, hoặc trả lời sai.' },
    { q: 'Đọc xong bạn có gì', a: 'Cách thiết kế flow nộp và rút để không mất tiền, không trả tiền hai lần, và không có order nào bị kẹt mà không ai biết. Bài có sequence chạy từng bước và state machine với các scenario lỗi để bấm thử.' },
  ],
  glossary: [
    { term: 'units', def: 'Phần sở hữu của bạn trong quỹ. Lãi làm giá trị units tăng dần mỗi ngày.' },
    { term: 'position', def: 'Số units và lãi bạn đang có ở quỹ. Khác với một giao dịch, nó tồn tại lâu dài.' },
    { term: 'orchestrator', def: 'Service điều phối các bên (ví, partner, bank) nhưng không tự giữ tiền hay tính lãi.' },
    { term: 'hold', def: 'Giữ tiền lại trong ví: số dư khả dụng giảm nhưng tiền chưa bị trừ, huỷ thì chỉ cần nhả ra.' },
    { term: 'debit / credit', def: 'Trừ tiền / cộng tiền trên ledger.' },
    { term: 'payout', def: 'Chuyển tiền từ pocket trên ví ra tài khoản ngân hàng thật.' },
    { term: 'state machine', def: 'Danh sách các trạng thái của một order và những bước chuyển hợp lệ giữa chúng.' },
  ],
};

export const BILLPAY_CONTEXT = {
  phone: {
    title: 'Hoá đơn tiền điện',
    rows: [
      { label: 'Kỳ thanh toán', value: 'Tháng 11' },
      { label: 'Số tiền', value: '452.000đ', big: true },
      { label: 'Trạng thái', value: 'Chưa thanh toán' },
    ],
    action: 'Thanh toán',
    after: [
      { label: 'Kỳ thanh toán', value: 'Tháng 11' },
      { label: 'Số tiền', value: '452.000đ', big: true },
      { label: 'Trạng thái', value: 'Đã gạch nợ', good: true },
    ],
    doneLabel: 'Thanh toán thành công',
  },
  scene: 'Cuối tháng app nhắc hoá đơn tiền điện 452.000đ. Bạn bấm Thanh toán, nhập PIN, xong. Vài giây sau hoá đơn được gạch nợ.',
  points: [
    { q: 'Bạn gặp nó ở đâu', a: 'Ở trả tiền điện, nước, internet, học phí, mua bảo hiểm, mua vé trong ví. Pattern này dùng cho mọi tính năng mà một team trong ví vừa thu tiền của user, vừa nhờ partner giao sản phẩm.' },
    { q: 'Phía sau có chuyện gì', a: 'Màn hình nhập PIN không thuộc về team billpay, mà thuộc về Core, hệ thống payment dùng chung của ví. Nên đúng lúc tiền bị trừ, team billpay không hề hay biết. Sau đó họ còn phải gọi partner (điện lực, công ty bảo hiểm…) để gạch nợ, và partner có thể fail.' },
    { q: 'Đọc xong bạn có gì', a: 'Cách lấp khoảng mù đó bằng event và reconciliation, chọn hold hay debit tuỳ Core hỗ trợ gì, và khi partner fail thì hoàn tiền thế nào cho đúng.' },
  ],
  glossary: [
    { term: 'Core', def: 'Hệ thống payment và wallet dùng chung của cả ví, sở hữu luôn màn hình thanh toán (chọn nguồn tiền, PIN).' },
    { term: 'team service', def: 'Service của một tính năng cụ thể như billpay hay bảo hiểm. Giữ trạng thái giao dịch của tính năng đó.' },
    { term: 'payment session', def: 'Phiên thanh toán Core tạo ra trước khi user trả tiền. Tạo session chưa động vào tiền.' },
    { term: 'partner', def: 'Bên thật sự giao sản phẩm: điện lực gạch nợ hoá đơn, công ty bảo hiểm phát hành hợp đồng.' },
    { term: 'outbox', def: 'Cách ghi event vào DB cùng transaction với lệnh trừ tiền, để event không bao giờ mất.' },
    { term: 'reconciliation', def: 'Job định kỳ đi hỏi lại trạng thái thật ở Core và partner để sửa những gì event bỏ sót.' },
  ],
};
