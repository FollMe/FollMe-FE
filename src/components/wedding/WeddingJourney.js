import { Link } from 'react-router-dom';
import { IoHeartOutline, IoCalendarOutline, IoMailOpenOutline, IoArrowForward } from 'react-icons/io5';
import styles from './Wedding.module.scss';

const STEPS = [
  {
    to: '/fortune/hop-tuoi',
    icon: <IoHeartOutline />,
    step: 'Bước 1',
    title: 'Xem tuổi hợp nhau',
    text: 'Con giáp, mệnh và thần số học của hai bạn, chấm điểm và giải thích rõ ràng.',
    cta: 'Xem độ hợp',
  },
  {
    to: '/cuoi-hoi/chon-ngay',
    icon: <IoCalendarOutline />,
    step: 'Bước 2',
    title: 'Chọn ngày cưới',
    text: 'Lọc ngày hoàng đạo không xung tuổi, tránh tháng cô hồn, kèm giờ tốt và cảnh báo Kim Lâu.',
    cta: 'Tìm ngày đẹp',
  },
  {
    to: '/events/create?type=wedding',
    icon: <IoMailOpenOutline />,
    step: 'Bước 3',
    title: 'Gửi thiệp cưới online',
    text: 'Thiệp đẹp trên điện thoại, khách xác nhận tham dự và gửi lời chúc ngay trên thiệp.',
    cta: 'Tạo thiệp miễn phí',
  },
];

export default function WeddingJourney() {
  return (
    <ol className={styles.journey}>
      {STEPS.map(s => (
        <li key={s.to}>
          <Link to={s.to} className={styles.step}>
            <span className={styles.stepIcon}>{s.icon}</span>
            <span className={styles.stepNo}>{s.step}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <span className={styles.stepCta}>{s.cta} <IoArrowForward /></span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
