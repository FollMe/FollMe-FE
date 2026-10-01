import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import {
  IoArrowForward, IoHeartOutline, IoGridOutline, IoCalculatorOutline, IoNewspaperOutline, IoLibraryOutline,
  IoLogoGithub, IoCheckmarkCircle,
} from 'react-icons/io5';
import Reveal from 'components/Reveal';
import TodayAlmanacCard from 'components/almanac/TodayAlmanacCard';
import ContinueReading from 'components/reading/ContinueReading';
import ThemePreview from 'components/invitation/ThemePreview';
import WeddingJourney from 'components/wedding/WeddingJourney';
import ThemeShowcase from 'components/wedding/ThemeShowcase';
import { getStoryLink } from 'components/story/StoryItem';
import { useUserInfo } from 'customHooks/useUserInfo';
import { handleCheckLoggedIn } from 'util/authHelper';
import { formatLongDate } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import { request } from 'util/request';
import styles from './Home.module.scss';

const GITHUB_URL = 'https://github.com/sumsv50';

const INVITE_FEATURES = [
  'Thiệp đẹp trên điện thoại, 4 mẫu để chọn',
  'Khách xác nhận tham dự, bạn biết trước số người',
  'Sổ lưu bút: khách gửi lời chúc ngay trên thiệp',
  'Link chung cho nhóm Zalo và mã QR để in lên thiệp giấy',
  'Ghi kèm ngày âm lịch, chỉ đường, lưu vào lịch',
];

export default function Home() {
  const navigate = useNavigate();
  const [userInfo] = useUserInfo();
  const isLoggedIn = useMemo(() => handleCheckLoggedIn(userInfo.sessionExp), [userInfo]);
  const [corner, setCorner] = useState([]);

  useEffect(() => {
    setPageMeta({
      title: null,
      description: 'Xem tuổi hợp nhau, chọn ngày cưới đẹp và gửi thiệp cưới online miễn phí: khách xác nhận tham dự, gửi lời chúc ngay trên thiệp. Kèm lịch vạn niên và tử vi hằng ngày.',
    });
    loadCorner();

    async function loadCorner() {
      try {
        const [blogRes, storyRes] = await Promise.all([request.get('api/blogs'), request.get('api/stories')]);
        const blogs = (blogRes?.blogs ?? []).map(b => ({
          key: `b-${b._id}`, to: `/blogs/${b.slug}`, title: b.title, kind: 'Blog', at: b.updatedAt, icon: <IoNewspaperOutline />,
        }));
        const stories = (storyRes?.stories ?? []).map(s => ({
          key: `s-${s._id}`, to: getStoryLink(s), title: s.name, kind: 'Truyện', at: s.updatedAt, icon: <IoLibraryOutline />,
        }));
        setCorner([...blogs, ...stories].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 4));
      } catch (err) {
        console.log(err);
      }
    }
  }, []);

  function createInvitation() {
    track('home_create_invitation', { loggedIn: isLoggedIn });
    // Signed-out visitors sign in first and come back to the editor.
    navigate('/events/create?type=wedding');
  }

  return (
    <div className={styles.home}>
      {/* ---------- Hero ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden />
        <div className={`container ${styles.heroInner}`}>
          <div>
            <span className={`${styles.pill} fade-up`}>💍 Cưới hỏi & những ngày quan trọng</span>
            <h1 className={`${styles.heroTitle} fade-up`} style={{ animationDelay: '80ms' }}>
              Từ xem tuổi đến thiệp cưới, <em>tất cả ở một nơi.</em>
            </h1>
            <p className={`${styles.heroLead} fade-up`} style={{ animationDelay: '160ms' }}>
              Xem hai bạn hợp nhau đến đâu, chọn ngày cưới đẹp theo tuổi, rồi gửi thiệp online để khách
              xác nhận tham dự và gửi lời chúc. Miễn phí, không cần cài ứng dụng.
            </p>
            <div className={`${styles.heroActions} fade-up`} style={{ animationDelay: '240ms' }}>
              <Button variant="contained" size="large" endIcon={<IoArrowForward />} onClick={createInvitation}>
                Tạo thiệp cưới miễn phí
              </Button>
              <Button variant="outlined" size="large" startIcon={<IoHeartOutline />} component={Link} to="/fortune/hop-tuoi">
                Xem tuổi hợp nhau
              </Button>
            </div>
          </div>
          <div className={`${styles.heroVisual} fade-up`} style={{ animationDelay: '200ms' }} aria-hidden>
            <ThemePreview theme="night" type="wedding" groomName="Khoa" brideName="Ngân" startAt="18:30 · 15/05/2027" className={styles.heroBack} />
            <ThemePreview theme="blush" type="wedding" groomName="Minh" brideName="Lan" startAt="11:00 · 12/12/2026" className={styles.heroFront} />
          </div>
        </div>
      </section>

      {/* ---------- Journey ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHeadCenter}>
          <div className="eyebrow">Ba bước cho ngày vui</div>
          <h2 className={styles.sectionTitle}>Chuẩn bị đám cưới nhẹ nhàng hơn</h2>
        </Reveal>
        <Reveal><WeddingJourney /></Reveal>
      </section>

      {/* ---------- Invitations ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.invite}>
          <div className={styles.inviteText}>
            <div className="eyebrow">Thiệp mời online</div>
            <h2 className={styles.sectionTitle}>Một tấm thiệp, khách bấm là trả lời</h2>
            <ul className={styles.checks}>
              {INVITE_FEATURES.map(f => <li key={f}><IoCheckmarkCircle /> {f}</li>)}
            </ul>
            <div className={styles.heroActions}>
              <Button variant="contained" size="large" endIcon={<IoArrowForward />} onClick={createInvitation}>
                Tạo thiệp ngay
              </Button>
              <Button variant="text" size="large" component={Link} to="/cuoi-hoi">Tìm hiểu thêm</Button>
            </div>
          </div>
          <ThemeShowcase />
        </Reveal>
      </section>

      {/* ---------- Today ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHead}>
          <div>
            <div className="eyebrow">Hôm nay</div>
            <h2 className={styles.sectionTitle}>Xem ngày & tử vi hằng ngày</h2>
          </div>
          <Link to="/fortune" className={styles.seeAll}>Thần số học & Tử vi <IoArrowForward /></Link>
        </Reveal>
        <div className={styles.todayGrid}>
          <Reveal>
            <TodayAlmanacCard className={styles.todayCard} />
          </Reveal>
          <Reveal delay={80}>
            <Link to="/fortune/numerology" className={styles.fortuneTile}>
              <span className={styles.featureIcon}><IoCalculatorOutline /></span>
              <h3>Thần số học</h3>
              <p>Con số chủ đạo và ý nghĩa họ tên của bạn.</p>
            </Link>
          </Reveal>
          <Reveal delay={160}>
            <Link to="/fortune/tu-vi" className={styles.fortuneTile}>
              <span className={styles.featureIcon}><IoGridOutline /></span>
              <h3>Lá số tử vi</h3>
              <p>12 cung, chính tinh và vận hạn năm nay.</p>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Returning readers ---------- */}
      <ContinueReading className={`container ${styles.section}`} />

      {/* ---------- The author's corner ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.corner}>
          <div className={styles.cornerAbout}>
            <img src="/imgs/3 (2).jpg" alt="Sum Quốc" loading="lazy" />
            <div>
              <div className="eyebrow">Góc nhỏ</div>
              <h2 className={styles.cornerTitle}>Của Sum Quốc</h2>
              <p>
                Mình là lập trình viên đã tự xây FollMe. Ở góc này mình ghi lại bài học khi làm phần mềm
                và vài câu chuyện đời thường.
              </p>
              <div className={styles.cornerLinks}>
                <Link to="/blogs">Blog</Link>
                <Link to="/stories">Truyện</Link>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer"><IoLogoGithub /> GitHub</a>
              </div>
            </div>
          </div>
          {corner.length > 0 && (
            <ul className={styles.cornerList}>
              {corner.map(item => (
                <li key={item.key}>
                  <Link to={item.to}>
                    <span className={styles.cornerIcon}>{item.icon}</span>
                    <span className={styles.cornerItemTitle}>{item.title}</span>
                    <span className={styles.cornerMeta}>{item.kind} · {formatLongDate(item.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </section>
    </div>
  )
}
