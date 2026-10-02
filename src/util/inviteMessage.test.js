import { defaultReminder, defaultTemplate, inviteMessage, inviteWhen } from './inviteMessage';

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
