import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { IoCalculatorOutline, IoGridOutline, IoBookmarksOutline, IoCalendarOutline, IoHeartOutline } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import TodayAlmanacCard from 'components/almanac/TodayAlmanacCard';
import { useUserInfo } from 'customHooks/useUserInfo';
import { handleCheckLoggedIn } from 'util/authHelper';
import { DISCLAIMER } from 'util/fortune';
import styles from './Fortune.module.scss';

const METHODS = [
  {
    to: '/fortune/hop-tuoi',
    icon: <IoHeartOutline />,
    title: 'Xem tuổi hợp nhau',
    text: 'Nhập ngày sinh hai người để xem độ hợp theo con giáp, mệnh và thần số học, kèm lời giải thích cho từng điểm.',
    cta: 'Xem độ hợp →',
  },
  {
    to: '/fortune/numerology',
    icon: <IoCalculatorOutline />,
    title: 'Thần số học',
    text: 'Số chủ đạo, các con số từ họ tên, biểu đồ ngày sinh và bốn đỉnh cao cuộc đời theo trường phái Pythagoras.',
    cta: 'Xem thần số học →',
  },
  {
    to: '/fortune/tu-vi',
    icon: <IoGridOutline />,
    title: 'Lá số tử vi',
    text: 'Lập lá số Tử Vi Đẩu Số theo lịch âm Việt Nam: 12 cung, 14 chính tinh, Tứ Hóa, đại hạn và tiểu hạn năm nay.',
    cta: 'Lập lá số →',
  },
  {
    to: '/fortune/lich',
    icon: <IoCalendarOutline />,
    title: 'Lịch vạn niên',
    text: 'Ngày âm lịch, can chi, ngày hoàng đạo – hắc đạo, giờ tốt và tiết khí cho bất kỳ ngày nào.',
    cta: 'Xem ngày →',
  },
];

export default function FortuneHome() {
  const [userInfo] = useUserInfo();
  const isLoggedIn = useMemo(() => handleCheckLoggedIn(userInfo.sessionExp), [userInfo]);

  useEffect(() => {
    document.title = 'Thần số học & Tử vi | FollMe';
  }, []);

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Khám phá bản thân"
        title="Thần số học & Tử vi"
        description="Xem ngày tốt xấu, hoặc nhập ngày giờ sinh để xem các con số và lá số của bạn. Mỗi luận giải đều ghi rõ quy tắc đã tạo ra nó."
        actions={isLoggedIn && (
          <Button component={Link} to="/fortune/profiles" variant="outlined" startIcon={<IoBookmarksOutline />}>
            Hồ sơ đã lưu
          </Button>
        )}
      />

      <TodayAlmanacCard className={styles.today} />

      <div className={styles.methods}>
        {METHODS.map(m => (
          <Link key={m.to} to={m.to} className={styles.method}>
            <span className={styles.methodIcon}>{m.icon}</span>
            <h2 className={styles.methodTitle}>{m.title}</h2>
            <p className={styles.methodText}>{m.text}</p>
            <span className={styles.methodCta}>{m.cta}</span>
          </Link>
        ))}
      </div>

      <div className={styles.notes}>
        <div className={styles.note}>
          <strong>Không cần đăng nhập</strong>
          Khách có thể xem ngay. Thông tin bạn nhập không được lưu lại trên máy chủ.
        </div>
        <div className={styles.note}>
          <strong>Lịch âm Việt Nam</strong>
          Lịch âm được tính theo múi giờ Việt Nam (UTC+7), nên có thể khác lịch Trung Quốc ở một số năm.
        </div>
        <div className={styles.note}>
          <strong>Để tham khảo</strong>
          {DISCLAIMER}
        </div>
      </div>
    </div>
  );
}
