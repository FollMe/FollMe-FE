import {
  daysToAnswer, deadlineText, defaultReminder, defaultTemplate, defaultThanks, inviteMessage, inviteWhen, loadTemplate, saveTemplate,
  shortDay,
} from './inviteMessage';

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
