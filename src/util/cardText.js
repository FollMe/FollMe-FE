import dayjs from 'dayjs';
import { vnWallClock } from './date';
import { formatVnd, shortVnd } from './gifts';

// The guest card in Vietnamese or English. What the host wrote (names,
// title, place, program, story) stays as written; only the card's own
// words change. English is for foreign friends and family abroad.

export const CARD_LANGS = ['vi', 'en'];

const WEEKDAYS_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const ORDINALS = ['th', 'st', 'nd', 'rd'];

/** 1 -> "1st", 22 -> "22nd", 13 -> "13th". */
export function ordinal(n) {
  const mod = n % 100;
  return `${n}${(mod >= 11 && mod <= 13) ? 'th' : ORDINALS[n % 10] ?? 'th'}`;
}

/** "Saturday, 9 January": a day in Vietnam, in English. */
export function shortDayEn(date) {
  return dayjs(vnWallClock(date)).format('dddd, D MMMM');
}

const vi = {
  lang: 'vi',
  recipient: name => name || 'bạn',
  // The cover: "Trân trọng kính mời <bạn> / tới dự lễ thành hôn của"
  cover({ name, type, isOver }) {
    if (isOver) {
      return {
        lead: 'Cảm ơn ', who: name || 'bạn', tail: '',
        line: { wedding: 'đã chung vui trong lễ thành hôn của', engagement: 'đã chung vui trong lễ ăn hỏi của' }[type] ?? 'đã tới dự',
      };
    }
    return {
      lead: 'Trân trọng kính mời ', who: name || 'bạn', tail: '',
      line: { wedding: 'tới dự lễ thành hôn của', engagement: 'tới dự lễ ăn hỏi của' }[type] ?? 'tới dự',
    };
  },
  kicker: ({ couple, isOver }) => (couple ? (isOver ? 'Thank you' : 'Save the date') : (isOver ? 'Lời cảm ơn' : 'Thư mời')),
  coupleAlt: (groom, bride) => `${groom} và ${bride}`,
  scratch: couple => (couple ? 'Cào để xem ngày cưới' : 'Cào để xem ngày'),
  scratchKey: 'Nhấn Enter để xem ngay',
  seatLead: name => `Mời ${name || 'bạn'} ngồi `,
  table: table => (/^\d+$/.test(table ?? '') ? `Bàn ${table}` : table),
  scrollCue: 'Xem tiếp',
  album: couple => (couple ? 'Khoảnh khắc' : 'Hình ảnh'),
  whenTitle: 'Ngày chung vui',
  when: (at, away) => `${WEEKDAYS_VI[at.getDay()]} · ${dayjs(at).format('HH:mm')}${away ? ' (giờ Việt Nam)' : ''}`,
  lunar: (lunar, monthLabel) => `Tức ngày ${lunar.lunar.day} ${monthLabel} năm ${lunar.yearName}`,
  countdown: 'Đếm ngược',
  units: { days: 'Ngày', hours: 'Giờ', minutes: 'Phút', seconds: 'Giây' },
  liveNow: 'Tiệc đang diễn ra. Gửi lời chúc ở cuối thiệp nhé!',
  passed: 'Ngày vui đã qua. Cảm ơn bạn đã ghé thăm!',
  program: 'Chương trình',
  programNow: 'Đang diễn ra',
  whereTitle: 'Địa điểm',
  notesTitle: 'Lưu ý nhỏ',
  noteKinds: { dress: 'Trang phục', parking: 'Gửi xe', kids: 'Trẻ em', stay: 'Chỗ nghỉ' },
  map: 'Bản đồ',
  directions: 'Chỉ đường',
  footer: couple => (couple ? 'Rất hân hạnh được đón tiếp!' : 'Hẹn gặp bạn!'),
  madeWith: 'Thiệp được làm miễn phí trên FollMe',
  makeOne: demo => (demo ? 'Tạo thiệp của bạn' : 'Tạo thiệp như thế này'),
  dock: {
    label: 'Đi nhanh', rsvp: 'Xác nhận', photos: 'Ảnh', directions: 'Chỉ đường', gift: couple => (couple ? 'Mừng cưới' : 'Quà mừng'), wishes: 'Lời chúc',
  },
  pageTitle: headline => `Thiệp mời: ${headline}`,
  pageTo: name => `Gửi ${name}. `,

  // Envelope
  envelopeTo: 'Gửi',
  envelopeInvite: 'Trân trọng kính mời',
  openCard: 'Mở thiệp',
  openHint: 'Chạm vào con dấu để mở thiệp',
  soundHint: '♪ Bật âm thanh để nghe nhạc',
  musicOn: 'Bật nhạc',
  musicOff: 'Tắt nhạc',

  // Month calendar
  weekHead: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  monthTitle: (month, year) => `Tháng ${month + 1} · ${year}`,
  monthLabel: (month, year, day) => `Lịch tháng ${month + 1} năm ${year}, khoanh tròn ngày ${day}`,

  // RSVP
  rsvp: {
    labels: { attending: 'Sẽ tham dự', maybe: 'Chưa chắc', declined: 'Không thể đến' },
    choices: { attending: 'Chắc chắn rồi', maybe: 'Chưa chắc', declined: 'Tiếc quá' },
    title: 'Bạn sẽ đến chứ?',
    answeredTitle: 'Xác nhận tham dự',
    answered: 'Bạn đã trả lời:',
    people: n => `${n} người`,
    vegetarian: n => `${n} ăn chay`,
    song: 'Bài bạn muốn nghe:',
    change: 'Đổi câu trả lời',
    hint: 'Một câu trả lời nhỏ giúp gia chủ chuẩn bị chu đáo hơn.',
    hintBy: day => `Vui lòng trả lời trước ${day} để gia chủ chuẩn bị chu đáo hơn.`,
    hintLate: day => `Đã qua hạn trả lời (${day}). Bạn vẫn trả lời được, gia chủ sẽ cố gắng sắp xếp.`,
    day: date => {
      const at = vnWallClock(date);
      return `${WEEKDAYS_VI[at.getDay()].replace(/^T/, 't')}, ${dayjs(at).format('DD/MM')}`;
    },
    yourName: 'Tên của bạn',
    nameNeeded: 'Vui lòng cho biết tên của bạn',
    howMany: 'Đi mấy người?',
    fewer: 'Bớt một người',
    more: 'Thêm một người',
    vegetarianCount: 'Trong đó ăn chay',
    fewerVegetarian: 'Bớt một người ăn chay',
    moreVegetarian: 'Thêm một người ăn chay',
    askVegetarian: 'Có người ăn chay?',
    songLabel: 'Muốn nghe bài gì ở tiệc? (không bắt buộc)',
    songPlaceholder: 'VD: Ngày đầu tiên – Đức Phúc',
    note: 'Nhắn gia chủ (không bắt buộc)',
    send: 'Gửi xác nhận',
    demoSent: 'Thiệp mẫu: câu trả lời không được gửi đi. Tạo thiệp của bạn để dùng thật nhé!',
    sentDeclined: 'Đã gửi. Tiếc quá, hẹn bạn dịp khác!',
    sentAttending: 'Đã xác nhận. Hẹn gặp bạn nhé!',
    shuttleTitle: 'Đi xe đưa đón?',
    ownWay: 'Tự đi',
    seatsLeft: n => `còn ${n} chỗ`,
    busFull: 'Hết chỗ',
    notEnough: n => `Xe này chỉ còn ${n} chỗ, chưa đủ cho cả nhóm. Chọn xe khác hoặc bớt người nhé.`,
    onBus: 'Đi xe:',
  },

  // Wishes
  wishes: {
    title: 'Sổ lưu bút',
    sub: 'Để lại một lời chúc, gia chủ sẽ đọc được ngay.',
    yourName: 'Tên của bạn',
    nameNeeded: 'Vui lòng cho biết tên của bạn',
    label: 'Lời chúc',
    send: 'Gửi lời chúc',
  },

  // Calendar
  calendar: {
    button: 'Lưu vào lịch',
    other: 'Lịch iPhone, Outlook',
    program: away => `Chương trình${away ? ' (giờ Việt Nam)' : ''}`,
    card: 'Thiệp mời',
    file: 'thiep-moi.ics',
  },

  // Story
  story: 'Chuyện chúng mình',

  // Gift box
  gift: {
    title: couple => (couple ? 'Mừng cưới' : 'Gửi quà mừng'),
    sub: couple => (couple
      ? 'Thay cho phong bì, bạn có thể gửi quà mừng tới cô dâu chú rể qua mã QR.'
      : 'Bạn có thể gửi quà mừng tới gia chủ qua mã QR.'),
    sides: { groom: 'Nhà trai', bride: 'Nhà gái', host: 'Gia chủ' },
    money: formatVnd,
    // What a quick-amount chip puts in the field
    moneyInput: amount => formatVnd(amount).replace(' đ', ''),
    shortMoney: shortVnd,
    open: 'Mở hộp mừng',
    tap: 'Chạm để mở',
    sendTo: 'Gửi tới',
    sample: 'Mã mẫu',
    bank: bin => `Ngân hàng ${bin}`,
    copy: account => `Chép số tài khoản ${account}`,
    copied: 'Đã chép số tài khoản',
    hint: 'Mở app ngân hàng và quét mã, lời nhắn đã được điền sẵn.',
    demoHint: 'Đây là thiệp mẫu, mã QR chỉ để minh hoạ.',
    who: couple => (couple ? 'cô dâu chú rể' : 'gia chủ'),
    claimed: amount => `Bạn đã báo gửi quà mừng${amount ? ` ${amount}` : ''}. Cảm ơn bạn nhiều!`,
    undo: 'Huỷ',
    claim: 'Mình đã chuyển khoản rồi',
    amount: 'Số tiền (không bắt buộc)',
    suggested: 'Số tiền gợi ý',
    placeholder: 'VD: 500k, 1tr2',
    unreadable: 'Chưa hiểu số tiền, thử 500k hoặc 1.000.000',
    privateNote: who => `Chỉ ${who} thấy, để ghi vào sổ mừng.`,
    sending: 'Đang gửi…',
    tell: who => `Báo cho ${who}`,
    cancel: 'Thôi',
  },

  // Self check-in
  arrive: {
    welcome: name => `Chào mừng ${name || 'bạn'}!`,
    seatLead: name => `Mời ${name || 'bạn'} ngồi `,
    noTable: 'Người đón khách sẽ đưa bạn vào chỗ nhé.',
    at: time => `Đã báo đến lúc ${time}`,
    time: at => dayjs(at).format('HH:mm'),
    title: 'Bạn đã tới nơi?',
    text: 'Bấm để báo cô dâu chú rể và người đón khách, không cần xếp hàng ở bàn tiếp tân.',
    sending: 'Đang báo…',
    button: 'Mình đã đến',
  },

  // Seat finder
  seat: {
    title: 'Bạn ngồi bàn nào?',
    placeholder: 'Gõ tên của bạn, không dấu cũng được',
    label: 'Tên để tìm bàn',
    failed: 'Chưa tra được, thử lại sau giây lát nhé.',
    none: q => `Không thấy tên “${q}”. Thử gõ tên khác, hoặc hỏi người đón khách ở cửa nhé.`,
    noTable: 'Chưa xếp bàn, hỏi người đón khách nhé',
  },

  // Guest photos and the album
  photos: {
    title: 'Ảnh từ khách',
    count: n => `${n} khoảnh khắc mọi người đã chụp`,
    empty: 'Bạn chụp được tấm nào đẹp? Gửi lên để cô dâu chú rể và mọi người cùng xem.',
    tooMany: (max, n) => `Mỗi người gửi tối đa ${max} ảnh, gửi ${n} ảnh đầu nhé.`,
    unreadable: 'Không đọc được một ảnh, thử chọn ảnh JPG hoặc PNG nhé.',
    sent: n => (n > 1 ? `Đã gửi ${n} ảnh. Cảm ơn bạn!` : 'Đã gửi ảnh. Cảm ơn bạn!'),
    confirmRemove: 'Xoá ảnh này khỏi album?',
    sending: (i, n) => `Đang gửi ${i}/${n}…`,
    full: max => `Bạn đã gửi đủ ${max} ảnh`,
    send: 'Gửi ảnh bạn chụp',
    answerFirst: 'Xác nhận tham dự ở trên (nhập tên) là gửi được ảnh nhé.',
    view: name => `Xem ảnh của ${name || 'khách'}`,
    remove: 'Xoá ảnh của bạn',
    viewAt: (i, n) => `Xem ảnh ${i} trên ${n}`,
    at: (i, n) => `Ảnh ${i} trên ${n}`,
    by: name => `Ảnh của ${name}`,
    close: 'Đóng',
    prev: 'Ảnh trước',
    next: 'Ảnh sau',
  },

  // Before the card loads
  loading: 'Đang mở thiệp…',
  unavailable: {
    offlineTitle: 'Không mở được thiệp',
    offlineText: 'Kiểm tra kết nối mạng rồi thử lại nhé.',
    publicTitle: 'Link chung không còn mở',
    publicText: 'Gia chủ đã tắt link chung của thiệp này. Bạn nhắn người gửi để xin link mới nhé.',
    missingTitle: 'Thiệp mời không còn hiệu lực',
    missingText: 'Có thể gia chủ đã cập nhật danh sách khách. Bạn nhắn người gửi để xin link mới nhé.',
    retry: 'Thử lại',
    home: 'Về FollMe',
  },

  // Language switch
  switchTo: 'English',
  switchLabel: 'Read this invitation in English',
};

const en = {
  lang: 'en',
  recipient: name => name || 'you',
  cover({ name, type, isOver }) {
    if (isOver) {
      return {
        lead: name ? 'Thank you, ' : 'Thank you', who: name, tail: name ? ',' : '',
        line: { wedding: 'for celebrating the wedding of', engagement: 'for celebrating the engagement of' }[type] ?? 'for joining us at',
      };
    }
    const to = { wedding: 'to the wedding of', engagement: 'to the engagement ceremony of' }[type] ?? 'to';
    return name
      ? { lead: 'Dear ', who: name, tail: ',', line: `you are warmly invited ${to}` }
      : { lead: 'You are warmly invited', who: '', tail: '', line: to };
  },
  kicker: ({ couple, isOver }) => (isOver ? 'Thank you' : (couple ? 'Save the date' : 'Invitation')),
  coupleAlt: (groom, bride) => `${groom} and ${bride}`,
  scratch: () => 'Scratch to see the date',
  scratchKey: 'Press Enter to reveal it',
  seatLead: () => 'Your seat: ',
  table: table => (/^\d+$/.test(table ?? '') ? `Table ${table}` : table),
  scrollCue: 'Scroll down',
  album: couple => (couple ? 'Moments' : 'Photos'),
  whenTitle: 'When',
  when: (at, away) => `${dayjs(at).format('dddd, D MMMM YYYY · h:mm A')}${away ? ' (Vietnam time)' : ''}`,
  lunar: lunar => `Lunar calendar: day ${lunar.lunar.day} of the ${ordinal(lunar.lunar.month)}${lunar.lunar.isLeapMonth ? ' (leap)' : ''} month`,
  countdown: 'Countdown',
  units: { days: 'Days', hours: 'Hours', minutes: 'Mins', seconds: 'Secs' },
  liveNow: 'The party is on! Leave a wish at the end of the card.',
  passed: 'The day has passed. Thank you for stopping by!',
  program: 'Program',
  programNow: 'Now',
  whereTitle: 'Where',
  notesTitle: 'Good to know',
  noteKinds: { dress: 'Dress code', parking: 'Parking', kids: 'Children', stay: 'Where to stay' },
  map: 'Map',
  directions: 'Directions',
  footer: couple => (couple ? 'We look forward to celebrating with you!' : 'See you there!'),
  madeWith: 'Made for free with FollMe',
  makeOne: demo => (demo ? 'Make your own' : 'Make one like this'),
  dock: {
    label: 'Quick links', rsvp: 'RSVP', photos: 'Photos', directions: 'Directions', gift: () => 'Gift', wishes: 'Wishes',
  },
  pageTitle: headline => `Invitation: ${headline}`,
  pageTo: name => `For ${name}. `,

  envelopeTo: 'To',
  envelopeInvite: 'You are invited',
  openCard: 'Open the invitation',
  openHint: 'Tap the seal to open',
  soundHint: '♪ Turn your sound on for music',
  musicOn: 'Play music',
  musicOff: 'Stop music',

  weekHead: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  monthTitle: (month, year) => dayjs(new Date(year, month, 1)).format('MMMM YYYY'),
  monthLabel: (month, year, day) => `Calendar of ${dayjs(new Date(year, month, 1)).format('MMMM YYYY')}, with the ${ordinal(day)} circled`,

  rsvp: {
    labels: { attending: 'Attending', maybe: 'Not sure yet', declined: "Can't make it" },
    choices: { attending: "I'll be there", maybe: 'Not sure', declined: "Can't come" },
    title: 'Will you come?',
    answeredTitle: 'Your RSVP',
    answered: 'You answered:',
    people: n => `${n} people`,
    vegetarian: n => `${n} vegetarian`,
    song: 'Your song request:',
    change: 'Change my answer',
    hint: 'A quick answer helps the hosts prepare for you.',
    hintBy: day => `Please answer by ${day} so the hosts can prepare.`,
    hintLate: day => `The RSVP date (${day}) has passed. You can still answer and the hosts will do their best.`,
    day: shortDayEn,
    yourName: 'Your name',
    nameNeeded: 'Please tell us your name',
    howMany: 'How many of you?',
    fewer: 'One person fewer',
    more: 'One more person',
    vegetarianCount: 'Of them, vegetarian',
    fewerVegetarian: 'One vegetarian fewer',
    moreVegetarian: 'One more vegetarian',
    askVegetarian: 'Anyone vegetarian?',
    songLabel: 'A song you would like to hear? (optional)',
    songPlaceholder: 'e.g. Perfect – Ed Sheeran',
    note: 'A note to the hosts (optional)',
    send: 'Send my answer',
    demoSent: 'Sample card: your answer was not sent. Make your own card to use it for real!',
    sentDeclined: 'Sent. We will miss you!',
    sentAttending: 'Thank you! See you there!',
    shuttleTitle: 'Taking the shuttle bus?',
    ownWay: "I'll get there myself",
    seatsLeft: n => (n === 1 ? '1 seat left' : `${n} seats left`),
    busFull: 'Full',
    notEnough: n => `This bus has ${n} seat${n === 1 ? '' : 's'} left, not enough for everyone. Pick another one or fewer people.`,
    onBus: 'Your bus:',
  },

  wishes: {
    title: 'Guestbook',
    sub: 'Leave a wish: the hosts will read it right away.',
    yourName: 'Your name',
    nameNeeded: 'Please tell us your name',
    label: 'Your wish',
    send: 'Send my wish',
  },

  calendar: {
    button: 'Add to calendar',
    other: 'iPhone, Outlook calendar',
    program: away => `Program${away ? ' (Vietnam time)' : ''}`,
    card: 'Invitation',
    file: 'invitation.ics',
  },

  story: 'Our story',

  gift: {
    title: couple => (couple ? 'Wedding gift' : 'Send a gift'),
    sub: couple => (couple
      ? 'In place of the traditional red envelope, you can send the couple a gift by bank transfer. The QR code works with Vietnamese banking apps.'
      : 'You can send the hosts a gift by bank transfer. The QR code works with Vietnamese banking apps.'),
    sides: { groom: "Groom's family", bride: "Bride's family", host: 'Hosts' },
    money: amount => `${Math.round(amount ?? 0).toLocaleString('en-US')} VND`,
    moneyInput: amount => Math.round(amount).toLocaleString('en-US'),
    shortMoney: amount => (amount >= 1e6 ? `${Math.round(amount / 1e5) / 10}M` : `${Math.round(amount / 1e3)}k`),
    open: 'Open the gift box',
    tap: 'Tap to open',
    sendTo: 'Send to',
    sample: 'Sample',
    bank: bin => `Bank ${bin}`,
    copy: account => `Copy account number ${account}`,
    copied: 'Account number copied',
    hint: 'Scan with a Vietnamese banking app: the message is filled in. From abroad, use the account number and name above.',
    demoHint: 'This is a sample card: the QR code is only for show.',
    who: couple => (couple ? 'the couple' : 'the hosts'),
    claimed: amount => `You let them know you sent a gift${amount ? ` of ${amount}` : ''}. Thank you so much!`,
    undo: 'Undo',
    claim: "I've sent a gift",
    amount: 'Amount in VND (optional)',
    suggested: 'Suggested amounts',
    placeholder: 'e.g. 500k, 1000000',
    unreadable: 'Not sure about that amount: try 500k or 1000000',
    privateNote: who => `Only ${who} will see it, for their gift book.`,
    sending: 'Sending…',
    tell: who => `Let ${who} know`,
    cancel: 'Cancel',
  },

  arrive: {
    welcome: name => (name ? `Welcome, ${name}!` : 'Welcome!'),
    seatLead: () => 'Please take your seat at ',
    noTable: 'Someone at the welcome desk will show you to your seat.',
    at: time => `Checked in at ${time}`,
    time: at => dayjs(at).format('h:mm A'),
    title: 'Have you arrived?',
    text: 'Tap to let the couple and the welcome desk know: no need to queue at the reception table.',
    sending: 'Sending…',
    button: "I'm here",
  },

  seat: {
    title: 'Find your table',
    placeholder: 'Type your name',
    label: 'Your name, to find your table',
    failed: 'Could not look that up: try again in a moment.',
    none: q => `No “${q}” on the list. Try another spelling, or ask at the welcome desk.`,
    noTable: 'No table yet: ask at the welcome desk',
  },

  photos: {
    title: 'Photos from guests',
    count: n => (n === 1 ? '1 moment captured by a guest' : `${n} moments captured by everyone`),
    empty: 'Took a nice photo? Share it so the couple and everyone can see it.',
    tooMany: (max, n) => `Up to ${max} photos each: sending the first ${n}.`,
    unreadable: 'Could not read a photo: try a JPG or PNG.',
    sent: n => (n > 1 ? `${n} photos sent. Thank you!` : 'Photo sent. Thank you!'),
    confirmRemove: 'Remove this photo from the album?',
    sending: (i, n) => `Sending ${i}/${n}…`,
    full: max => `You have shared ${max} photos`,
    send: 'Share your photos',
    answerFirst: 'Answer the RSVP above (with your name) to share photos.',
    view: name => `View the photo by ${name || 'a guest'}`,
    remove: 'Remove your photo',
    viewAt: (i, n) => `View photo ${i} of ${n}`,
    at: (i, n) => `Photo ${i} of ${n}`,
    by: name => `Photo by ${name}`,
    close: 'Close',
    prev: 'Previous photo',
    next: 'Next photo',
  },

  loading: 'Opening your invitation…',
  unavailable: {
    offlineTitle: 'Could not open the invitation',
    offlineText: 'Check your connection and try again.',
    publicTitle: 'This shared link is closed',
    publicText: 'The hosts have turned off the shared link. Ask the person who sent it for a new one.',
    missingTitle: 'This invitation is no longer available',
    missingText: 'The hosts may have updated their guest list. Ask the person who sent it for a new link.',
    retry: 'Try again',
    home: 'Go to FollMe',
  },

  switchTo: 'Tiếng Việt',
  switchLabel: 'Xem thiệp bằng tiếng Việt',
};

export const CARD_TEXT = { vi, en };

export function cardText(lang) {
  return CARD_TEXT[lang] ?? vi;
}

const storageKey = eventId => `follme.cardLang.${eventId}`;

/** The language this browser chose for an event's card, if it switched. */
export function loadCardLang(eventId) {
  try {
    const lang = localStorage.getItem(storageKey(eventId));
    return CARD_LANGS.includes(lang) ? lang : null;
  } catch (err) {
    return null;
  }
}

export function saveCardLang(eventId, lang) {
  try {
    localStorage.setItem(storageKey(eventId), lang);
  } catch (err) {
    // Kept for this visit only
  }
}

/** ?lang=en on a link (the English link the host shares in a group). */
export function urlCardLang(search = typeof window !== 'undefined' ? window.location.search : '') {
  const lang = new URLSearchParams(search).get('lang');
  return CARD_LANGS.includes(lang) ? lang : null;
}

/**
 * Which language the card opens in: what this browser switched to, else
 * the link's ?lang=, else what the host set for this guest, else Vietnamese.
 */
export function initialCardLang({ eventId, guest, search } = {}) {
  return (eventId && loadCardLang(eventId)) || urlCardLang(search) || (guest?.lang === 'en' ? 'en' : null) || 'vi';
}
