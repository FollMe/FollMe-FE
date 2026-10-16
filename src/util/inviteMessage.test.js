import {
  daysToAnswer, deadlineText, defaultDayOf, defaultDayOfEn, defaultMessage, defaultReminder, defaultReminderEn, defaultTemplate,
  defaultTemplateEn, defaultThanks, defaultThanksEn, inviteMessage, inviteWhen, inviteWhenEn, isEnglishGuest, loadTemplate,
  saveTemplate, shortDay,
} from './inviteMessage';
import { dayOfQueue, seatFinderOpen } from './invitation';
import { shuttleText } from './shuttles';

const wedding = {
  type: 'wedding', groomName: 'Đức', brideName: 'Hạnh', title: 'Lễ thành hôn', startAt: '2027-01-16T04:00:00Z',
};

describe('inviteWhen', () => {
  it('reads the time in Vietnam', () => {
    expect(inviteWhen('2027-01-16T04:00:00Z')).toBe('11:00 thứ Bảy, 16/01/2027');
    expect(inviteWhen('2027-01-16T17:30:00Z')).toBe('00:30 Chủ Nhật, 17/01/2027');
  });
});

describe('defaultTemplate', () => {
  it('names the couple and the time', () => {
    expect(defaultTemplate(wedding)).toBe(
      'Trân trọng kính mời {tên} tới dự lễ thành hôn của Đức & Hạnh vào 11:00 thứ Bảy, 16/01/2027.\n'
      + 'Thiệp mời dành riêng cho {tên}: {link}',
    );
    expect(defaultTemplate({ ...wedding, type: 'birthday', title: 'Sinh nhật Vy' }))
      .toMatch(/^Trân trọng kính mời \{tên\} tới dự Sinh nhật Vy vào/);
  });

  it('carries the program of the day', () => {
    const program = [{ time: '11:00', label: 'Đón khách' }, { time: '12:00', label: 'Khai tiệc' }];
    expect(defaultTemplate({ ...wedding, program })).toBe(
      'Trân trọng kính mời {tên} tới dự lễ thành hôn của Đức & Hạnh vào 11:00 thứ Bảy, 16/01/2027.\n'
      + 'Đón khách 11:00 · Khai tiệc 12:00.\n'
      + 'Thiệp mời dành riêng cho {tên}: {link}',
    );
  });
});

describe('defaultReminder', () => {
  it('nudges the guest to answer on their card', () => {
    expect(defaultReminder(wedding)).toBe(
      'Đức & Hạnh rất mong được đón {tên} tới dự lễ thành hôn vào 11:00 thứ Bảy, 16/01/2027.\n'
      + 'Mong {tên} xác nhận tham dự trên thiệp mời để việc đón tiếp được chu đáo hơn: {link}',
    );
    expect(defaultReminder({ ...wedding, type: 'birthday', title: 'Sinh nhật Vy' }))
      .toMatch(/^Rất mong được đón \{tên\} tới dự Sinh nhật Vy vào 11:00/);
  });
});

describe('inviteMessage', () => {
  it('fills in every name and the link', () => {
    expect(inviteMessage('Mời {tên}! {tên} nhớ đến nha: {link}', 'Cô Ba', 'https://x/i/1'))
      .toBe('Mời Cô Ba! Cô Ba nhớ đến nha: https://x/i/1');
  });

  it('adds the link when the template lost it', () => {
    expect(inviteMessage('Mời {tên} nha  ', 'Tuấn', 'https://x/i/2')).toBe('Mời Tuấn nha\nhttps://x/i/2');
  });

  it('leaves names with $ patterns intact', () => {
    expect(inviteMessage('Mời {tên}', 'A $& B', 'u')).toBe('Mời A $& B\nu');
  });
});

describe('defaultThanks', () => {
  it('thanks the guest and points to the photos when there are some', () => {
    expect(defaultThanks({ ...wedding, photos: [{ url: 'x' }] })).toBe(
      'Đức & Hạnh xin cảm ơn {tên} đã chung vui cùng chúng mình trong ngày cưới.\n'
      + 'Ảnh và lời chúc của mọi người ở đây nhé: {link}',
    );
    expect(defaultThanks(wedding)).toMatch(/\nLời chúc của mọi người ở đây nhé: \{link\}$/);
    expect(defaultThanks({ ...wedding, type: 'birthday', title: 'Sinh nhật Vy' }))
      .toMatch(/^Cảm ơn \{tên\} đã chung vui cùng chúng mình tại Sinh nhật Vy\./);
  });

  it('keeps each kind of message apart', () => {
    saveTemplate('e1', 'Mời', 'invite');
    saveTemplate('e1', 'Nhắc', 'remind');
    saveTemplate('e1', 'Cảm ơn', 'thank');
    expect([loadTemplate('e1', 'invite'), loadTemplate('e1', 'remind'), loadTemplate('e1', 'thank')]).toEqual(['Mời', 'Nhắc', 'Cảm ơn']);
    saveTemplate('e1', null, 'thank');
    expect(loadTemplate('e1', 'thank')).toBeNull();
    expect(loadTemplate('e1', 'invite')).toBe('Mời');
  });
});

describe('answer-by date', () => {
  // Saturday 09/01/2027, end of the day in Vietnam
  const rsvpBy = '2027-01-09T16:59:59.999Z';
  const at = iso => new Date(iso).getTime();

  it('counts days by the calendar in Vietnam', () => {
    expect(shortDay(rsvpBy)).toBe('thứ Bảy, 09/01');
    expect(daysToAnswer(rsvpBy, at('2027-01-06T03:00:00Z'))).toBe(3);
    // 23:30 on the 8th in Vietnam is still the day before
    expect(daysToAnswer(rsvpBy, at('2027-01-08T16:30:00Z'))).toBe(1);
    expect(daysToAnswer(rsvpBy, at('2027-01-08T17:30:00Z'))).toBe(0);
    expect(daysToAnswer(rsvpBy, at('2027-01-09T17:30:00Z'))).toBe(-1);
  });

  it('says where it stands', () => {
    expect(deadlineText(rsvpBy, at('2027-01-06T03:00:00Z'))).toBe('Hạn trả lời thứ Bảy, 09/01, còn 3 ngày');
    expect(deadlineText(rsvpBy, at('2027-01-08T03:00:00Z'))).toBe('Hạn trả lời là ngày mai');
    expect(deadlineText(rsvpBy, at('2027-01-09T03:00:00Z'))).toBe('Hạn trả lời là hôm nay');
    expect(deadlineText(rsvpBy, at('2027-01-10T03:00:00Z'))).toBe('Đã qua hạn trả lời thứ Bảy, 09/01');
  });

  it('goes into the invitation and the reminder until it passes', () => {
    const before = at('2027-01-02T03:00:00Z');
    expect(defaultTemplate({ ...wedding, rsvpBy }, before)).toBe(
      'Trân trọng kính mời {tên} tới dự lễ thành hôn của Đức & Hạnh vào 11:00 thứ Bảy, 16/01/2027.\n'
      + 'Mong {tên} xác nhận tham dự trước thứ Bảy, 09/01.\n'
      + 'Thiệp mời dành riêng cho {tên}: {link}',
    );
    expect(defaultReminder({ ...wedding, rsvpBy }, before))
      .toMatch(/Mong \{tên\} xác nhận tham dự trên thiệp mời trước thứ Bảy, 09\/01 để việc đón tiếp/);
    const after = at('2027-01-11T03:00:00Z');
    expect(defaultTemplate({ ...wedding, rsvpBy }, after)).toBe(defaultTemplate(wedding));
    expect(defaultReminder({ ...wedding, rsvpBy }, after)).toBe(defaultReminder(wedding));
  });
});

describe('the message for the day', () => {
  const event = { ...wedding, location: 'Nhà hàng Hoa Sen', program: [{ time: '11:00', label: 'Đón khách' }, { time: '12:00', label: 'Khai tiệc' }] };

  it('says when, where, the table and the program', () => {
    const text = inviteMessage(defaultDayOf(event), 'Cô Ba', 'https://x/i/1', { table: '5' });
    expect(text).toBe(
      'Đức & Hạnh hẹn gặp Cô Ba tại lễ thành hôn lúc 11:00 thứ Bảy, 16/01/2027, ở Nhà hàng Hoa Sen.\n'
      + 'Chỗ ngồi của Cô Ba: Bàn 5.\n'
      + 'Đón khách 11:00 · Khai tiệc 12:00.\n'
      + 'Chỉ đường và thiệp của Cô Ba: https://x/i/1',
    );
  });

  it('leaves the table line out for a guest without one, keeps named tables', () => {
    const text = inviteMessage(defaultDayOf(event), 'Tuấn', 'u');
    expect(text).not.toContain('Chỗ ngồi');
    expect(text.split('\n')).toHaveLength(3);
    expect(inviteMessage('Bàn {bàn} nhé {tên}', 'An', 'u', { table: 'VIP' })).toBe('Bàn VIP nhé An\nu');
  });

  it('goes to guests who said yes, once, not those already there', () => {
    const guests = [
      { _id: '1', rsvp: { status: 'attending' } },
      { _id: '2', rsvp: { status: 'attending' }, dayOfAt: '2027-01-14' },
      { _id: '3', rsvp: { status: 'maybe' } },
      { _id: '4', rsvp: { status: 'attending' }, arrivedAt: '2027-01-16' },
      { _id: '5', rsvp: { status: 'attending' }, source: 'public' },
    ];
    expect(dayOfQueue(guests).map(g => g._id)).toEqual(['1']);
  });
});

describe('seat finder window', () => {
  const start = '2027-01-16T04:00:00Z';
  const at = hours => new Date(start).getTime() + hours * 3600000;

  it('opens 6 hours before the party and closes 12 hours after', () => {
    expect(seatFinderOpen(start, at(-7))).toBe(false);
    expect(seatFinderOpen(start, at(-6))).toBe(true);
    expect(seatFinderOpen(start, at(11.9))).toBe(true);
    expect(seatFinderOpen(start, at(12.1))).toBe(false);
  });
});

describe('English messages', () => {
  const englishWedding = { ...wedding, location: 'Riverside Palace, TP.HCM' };

  it('reads the time in Vietnam, in English', () => {
    expect(inviteWhenEn('2027-01-16T11:00:00Z')).toBe('6:00 PM, Saturday 16 January 2027');
  });

  it('invites, reminds, tells the day and thanks in English', () => {
    expect(defaultTemplateEn(englishWedding, Date.parse('2027-01-01T00:00:00Z'))).toBe(
      'Dear {tên},\nYou are warmly invited to the wedding of Đức & Hạnh at 11:00 AM, Saturday 16 January 2027 (Vietnam time), '
      + 'Riverside Palace, TP.HCM.\nYour invitation: {link}',
    );
    expect(defaultTemplateEn({ ...englishWedding, rsvpBy: '2027-01-09T16:59:00Z' }, Date.parse('2027-01-01T00:00:00Z')))
      .toContain('Please let us know if you can come by Saturday, 9 January.\n');
    expect(defaultReminderEn(englishWedding)).toMatch(/^Đức & Hạnh would love to see you, \{tên\}, at their wedding at 11:00 AM/);
    expect(defaultThanksEn(englishWedding)).toBe("Đức & Hạnh: thank you, {tên}, for celebrating our wedding with us.\nEveryone's wishes are here: {link}");
    expect(defaultDayOfEn(englishWedding)).toContain('Your seat: {bàn}.\n');
    expect(defaultMessage(englishWedding, 'thank', 'en')).toBe(defaultThanksEn(englishWedding));
    expect(defaultMessage(englishWedding, 'thank')).toBe(defaultThanks(englishWedding));
  });

  it('names the table in English', () => {
    expect(inviteMessage('Your seat: {bàn}.\nSee you!', 'John', 'https://x/1', { table: '5', lang: 'en' }))
      .toBe('Your seat: Table 5.\nSee you!\nhttps://x/1');
    expect(inviteMessage('Chỗ ngồi: {bàn}.', 'Cô Ba', 'https://x/1', { table: '5' })).toBe('Chỗ ngồi: Bàn 5.\nhttps://x/1');
  });

  it('keeps the English messages apart from the Vietnamese ones', () => {
    localStorage.clear();
    saveTemplate('e1', 'Hello {tên}', 'invite', 'en');
    expect(loadTemplate('e1', 'invite', 'en')).toBe('Hello {tên}');
    expect(loadTemplate('e1', 'invite')).toBeNull();
    expect(isEnglishGuest({ lang: 'en' })).toBe(true);
    expect(isEnglishGuest({})).toBe(false);
  });
});

describe('the bus in messages', () => {
  const bus = { _id: 'b1', label: 'Xe từ TP.HCM', time: '06:00', from: 'Ngã tư Hàng Xanh', seats: 45 };

  it('the day-before message has a bus line when there are buses', () => {
    expect(defaultDayOf(wedding)).not.toContain('{xe}');
    expect(defaultDayOf({ ...wedding, shuttles: [bus] })).toContain('Xe đưa đón: {xe}.\n');
    expect(defaultDayOfEn({ ...wedding, shuttles: [bus] })).toContain('Your bus: {xe}.\n');
  });

  it('fills the bus, or drops its line', () => {
    const template = 'Chào {tên}.\nXe đưa đón: {xe}.\nThiệp: {link}';
    expect(inviteMessage(template, 'Cô Ba', 'https://x/1', { shuttle: shuttleText(bus) }))
      .toBe('Chào Cô Ba.\nXe đưa đón: Xe từ TP.HCM, 06:00 tại Ngã tư Hàng Xanh.\nThiệp: https://x/1');
    expect(inviteMessage(template, 'Cô Ba', 'https://x/1', { shuttle: '' })).toBe('Chào Cô Ba.\nThiệp: https://x/1');
    expect(shuttleText(bus, 'en')).toBe('Xe từ TP.HCM, 06:00 from Ngã tư Hàng Xanh');
    expect(shuttleText({ label: 'Xe 2', time: '07:00' })).toBe('Xe 2, 07:00');
    expect(shuttleText(null)).toBe('');
  });
});
