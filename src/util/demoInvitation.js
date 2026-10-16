import dayjs from 'dayjs';
import { toAccountName } from './vietqr';

export const DEMO_COUPLES = {
  blush: { groomName: 'Minh', brideName: 'Lan' },
  classic: { groomName: 'Hùng', brideName: 'Mai' },
  minimal: { groomName: 'Tuấn', brideName: 'Vy' },
  night: { groomName: 'Khoa', brideName: 'Ngân' },
  garden: { groomName: 'Bảo', brideName: 'Thư' },
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
    program: [
      { time: '11:00', label: 'Đón khách' },
      { time: '11:30', label: 'Làm lễ thành hôn' },
      { time: '12:00', label: 'Khai tiệc' },
    ],
    story: [
      { when: 'Mùa thu 2020', title: 'Lần đầu gặp nhau', text: 'Một buổi chiều mưa, hai đứa trú chung mái hiên quán cà phê nhỏ ở Đà Lạt.' },
      { when: '14/02/2021', title: 'Ngày tỏ tình', text: 'Một bó hoa cúc hoạ mi và câu nói run run: "Mình thử thương nhau nhé?"' },
      { when: 'Tết 2024', title: 'Ra mắt hai gia đình' },
      { when: 'Tháng 6/2026', title: 'Ngày cầu hôn', text: 'Trên bãi biển Quy Nhơn, có người đã gật đầu.' },
    ],
    // Shown as a sample: the QR code does not encode these accounts
    gifts: [
      { side: 'groom', bankBin: '970436', accountNumber: '0000000000', accountName: toAccountName(`Nguyễn Văn ${couple.groomName}`) },
      { side: 'bride', bankBin: '970407', accountNumber: '0000000000', accountName: toAccountName(`Trần Thị ${couple.brideName}`) },
    ],
  };
}

export const DEMO_WISHES = [
  { _id: 'w1', name: 'Cô Ba', message: 'Chúc hai con trăm năm hạnh phúc, sớm có tin vui nha!', createdAt: '2026-09-28T09:00:00Z' },
  { _id: 'w2', name: 'Hội bạn cấp 3', message: 'Cuối cùng cũng chịu cưới! Nhớ để dành bàn gần sân khấu đó 🎉', createdAt: '2026-09-27T12:00:00Z' },
  { _id: 'w3', name: 'Anh Tuấn', message: 'Chúc mừng hai em. Hẹn gặp ở tiệc nhé!', createdAt: '2026-09-26T08:00:00Z' },
  { _id: 'w4', name: 'Thảo', message: 'Đẹp đôi quá trời, chúc hai bạn luôn thương nhau như ngày đầu 💕', createdAt: '2026-09-25T08:00:00Z' },
];
