import dayjs from 'dayjs';

export const DEMO_COUPLES = {
  blush: { groomName: 'Minh', brideName: 'Lan' },
  classic: { groomName: 'Hùng', brideName: 'Mai' },
  minimal: { groomName: 'Tuấn', brideName: 'Vy' },
  night: { groomName: 'Khoa', brideName: 'Ngân' },
};

/** A sample wedding about two months from now, at 11:00. */
export function demoEvent(theme = 'blush') {
  const couple = DEMO_COUPLES[theme] ?? DEMO_COUPLES.blush;
  const startAt = dayjs().add(66, 'day').hour(11).minute(0).second(0).millisecond(0);
  return {
    _id: 'demo',
    type: 'wedding',
    theme,
    title: `Lễ thành hôn ${couple.groomName} & ${couple.brideName}`,
    ...couple,
    startAt: startAt.toISOString(),
    location: 'Nhà hàng Hoa Sen, 12 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    mapLocation: '',
    message: 'Sau 5 năm thương nhau, tụi mình quyết định về chung một nhà.\nRất mong có bạn trong ngày vui này!',
    allowPublicLink: true,
  };
}

export const DEMO_WISHES = [
  { _id: 'w1', name: 'Cô Ba', message: 'Chúc hai con trăm năm hạnh phúc, sớm có tin vui nha!', createdAt: '2026-09-28T09:00:00Z' },
  { _id: 'w2', name: 'Hội bạn cấp 3', message: 'Cuối cùng cũng chịu cưới! Nhớ để dành bàn gần sân khấu đó 🎉', createdAt: '2026-09-27T12:00:00Z' },
  { _id: 'w3', name: 'Anh Tuấn', message: 'Chúc mừng hai em. Hẹn gặp ở tiệc nhé!', createdAt: '2026-09-26T08:00:00Z' },
  { _id: 'w4', name: 'Thảo', message: 'Đẹp đôi quá trời, chúc hai bạn luôn thương nhau như ngày đầu 💕', createdAt: '2026-09-25T08:00:00Z' },
];
