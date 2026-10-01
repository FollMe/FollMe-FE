import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoArrowForward, IoNewspaperOutline, IoLibraryOutline, IoLogoGithub, IoSparklesOutline } from 'react-icons/io5';
import Reveal from 'components/Reveal';
import Petals from 'components/invitation/Petals';
import TodayAlmanacCard from 'components/almanac/TodayAlmanacCard';
import ContinueReading from 'components/reading/ContinueReading';
import { getStoryLink } from 'components/story/StoryItem';
import { THEMES } from 'util/invitation';
import { DEMO_WISHES } from 'util/demoInvitation';
import { formatLongDate } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import { request } from 'util/request';
import styles from './Home.module.scss';

const GITHUB_URL = 'https://github.com/sumsv50';

const MARQUEE = ['Xem tuổi hợp nhau', 'Chọn ngày hoàng đạo', 'Thiệp cưới online', 'Xác nhận tham dự', 'Sổ lưu bút', 'Lịch vạn niên', 'Miễn phí'];

const MORE_WISHES = [
  { _id: 'm1', name: 'Bé Na', message: 'Chúc chú dì cưới vui, nhớ để phần bánh kem cho con nha!' },
  { _id: 'm2', name: 'Team Marketing', message: 'Happy wedding! Cả team sẽ đến đông đủ, chuẩn bị tinh thần nha 🥂' },
  { _id: 'm3', name: 'Ngoại', message: 'Ngoại chúc hai đứa thương nhau, bảo ban nhau mà sống.' },
  { _id: 'm4', name: 'Long', message: 'Bạn thân lấy vợ rồi, vui mà cũng buồn. Chúc mừng mày!' },
];

/** A tiny phone that runs the real sample invitation. */
function PhoneDemo({ theme, className }) {
  return (
    <div className={`${styles.phone} ${className ?? ''}`}>
      <div className={styles.notch} aria-hidden />
      <iframe
        key={theme}
        title="Thiệp cưới mẫu"
        src={`/thiep-mau/${theme}?embed=1`}
        loading="lazy"
      />
    </div>
  );
}

function ScoreVisual() {
  return (
    <div className={styles.visualScore} aria-hidden>
      <div className={styles.ring}><strong>8</strong><span>/10</span></div>
      <div className={styles.pair}><span>🐵 Minh</span><i>♥</i><span>Lan 🐷</span></div>
      <small>Mệnh Kim · Thổ sinh Kim</small>
    </div>
  );
}

function CalendarVisual() {
  const good = [3, 8, 11, 17, 22, 26];
  return (
    <div className={styles.visualCalendar} aria-hidden>
      <div className={styles.visualTitle}>Tháng 12</div>
      <div className={styles.miniGrid}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
          <span key={d} className={d === 17 ? styles.picked : good.includes(d) ? styles.goodDay : undefined}>{d}</span>
        ))}
      </div>
      <small>17/12 · Ngày Thanh Long hoàng đạo · 9/10</small>
    </div>
  );
}

function EnvelopeVisual() {
  return (
    <div className={styles.visualEnvelope} aria-hidden>
      <div className={styles.miniEnvelope}>
        <div className={styles.miniLetter}>Minh &amp; Lan</div>
        <div className={styles.miniFront} />
        <div className={styles.miniSeal}>囍</div>
      </div>
      <div className={styles.rsvpChips}>
        <span>🥂 32 người sẽ đến</span>
        <span>💌 18 lời chúc</span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    no: '01',
    title: 'Xem hai bạn hợp nhau đến đâu',
    text: 'Con giáp, thiên can, mệnh và thần số học, chấm điểm và giải thích bằng lời dễ hiểu. Gửi kết quả cho người ấy chỉ bằng một đường link.',
    to: '/fortune/hop-tuoi',
    cta: 'Xem tuổi',
    visual: <ScoreVisual />,
  },
  {
    no: '02',
    title: 'Chọn một ngày thật đẹp',
    text: 'Lọc ngày hoàng đạo không xung tuổi cô dâu chú rể, tránh tháng cô hồn, Tam Nương, Nguyệt Kỵ và ngày Tết. Có giờ tốt và cảnh báo Kim Lâu.',
    to: '/cuoi-hoi/chon-ngay',
    cta: 'Tìm ngày cưới',
    visual: <CalendarVisual />,
  },
  {
    no: '03',
    title: 'Gửi một tấm thiệp biết trả lời',
    text: 'Khách mở phong bì, xem lịch, chỉ đường, bấm xác nhận và để lại lời chúc. Bạn biết trước bao nhiêu người đến, không cần gọi từng người.',
    to: '/events/create?type=wedding',
    cta: 'Tạo thiệp',
    visual: <EnvelopeVisual />,
  },
];

export default function Home() {
  const [theme, setTheme] = useState('classic');
  const [corner, setCorner] = useState([]);

  useEffect(() => {
    setPageMeta({
      title: null,
      description: 'Thiệp cưới online có phong bì, lịch cưới, chỉ đường, xác nhận tham dự và sổ lưu bút. Kèm xem tuổi hợp nhau và chọn ngày cưới đẹp. Miễn phí.',
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
        setCorner([...blogs, ...stories].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 3));
      } catch (err) {
        console.log(err);
      }
    }
  }, []);

  const wishes = [...DEMO_WISHES, ...MORE_WISHES];

  return (
    <div className={styles.home}>
      {/* ---------- Hero: lacquer, gold and a real invitation ---------- */}
      <section className={styles.hero}>
        <Petals count={10} color="#d8b46a" />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <p className={`${styles.eyebrow} fade-up`}>Thiệp cưới · Xem tuổi · Chọn ngày</p>
            <h1 className={`${styles.heroTitle} fade-up`} style={{ animationDelay: '80ms' }}>
              Ngày vui,<br /><em>gói trọn</em> trong<br />một tấm thiệp.
            </h1>
            <p className={`${styles.heroLead} fade-up`} style={{ animationDelay: '160ms' }}>
              Khách mở phong bì trên điện thoại, xem ngày giờ, chỉ đường, xác nhận tham dự và để lại lời chúc.
              Bạn chỉ việc gửi một đường link.
            </p>
            <div className={`${styles.heroActions} fade-up`} style={{ animationDelay: '240ms' }}>
              <Link to="/events/create?type=wedding" className={styles.primary} onClick={() => track('home_create_invitation')}>
                Tạo thiệp miễn phí <IoArrowForward />
              </Link>
              <Link to="/thiep-mau" className={styles.ghost} onClick={() => track('home_open_demo')}>
                Mở thử thiệp mẫu
              </Link>
            </div>
            <div className={`${styles.themePicker} fade-up`} style={{ animationDelay: '320ms' }}>
              <span>Đổi mẫu:</span>
              {THEMES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.swatch} ${styles[`sw_${t.value}`]} ${theme === t.value ? styles.swatchOn : ''}`}
                  onClick={() => setTheme(t.value)}
                  aria-label={`Mẫu ${t.label}`}
                  aria-pressed={theme === t.value}
                  title={t.label}
                />
              ))}
            </div>
          </div>
          <div className={`${styles.heroPhone} fade-up`} style={{ animationDelay: '200ms' }}>
            <PhoneDemo theme={theme} />
            <p className={styles.phoneHint}>↑ Chạm vào con dấu để mở</p>
          </div>
        </div>
      </section>

      {/* ---------- Marquee ---------- */}
      <div className={styles.marquee} aria-hidden>
        <div className={styles.marqueeTrack}>
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((word, i) => (
            <span key={i}>{word}<i>✦</i></span>
          ))}
        </div>
      </div>

      {/* ---------- Three steps ---------- */}
      <section className={`container ${styles.steps}`}>
        <Reveal className={styles.stepsHead}>
          <p className={styles.kicker}>Ba bước cho ngày vui</p>
          <h2 className={styles.display}>Từ “mình có hợp nhau không?”<br />đến <em>“hẹn gặp ở tiệc nhé!”</em></h2>
        </Reveal>
        {STEPS.map((step, i) => (
          <Reveal key={step.no} className={`${styles.step} ${i % 2 ? styles.stepFlip : ''}`}>
            <div className={styles.stepText}>
              <span className={styles.stepNo}>{step.no}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <Link to={step.to} className={styles.stepLink}>{step.cta} <IoArrowForward /></Link>
            </div>
            <div className={styles.stepVisual}>{step.visual}</div>
          </Reveal>
        ))}
      </section>

      {/* ---------- Wishes wall ---------- */}
      <section className={styles.wishesBand}>
        <Reveal className="container">
          <p className={styles.kicker}>Sổ lưu bút</p>
          <h2 className={styles.display}>Mỗi tấm thiệp là một cuốn<br /><em>lưu bút</em> cho ngày cưới.</h2>
        </Reveal>
        {[wishes, [...wishes].reverse()].map((row, r) => (
          <div key={r} className={`${styles.wishRow} ${r ? styles.wishRowReverse : ''}`} aria-hidden={r === 1}>
            <div className={styles.wishTrack}>
              {[...row, ...row].map((w, i) => (
                <figure key={`${w._id}-${i}`} className={styles.wish} style={{ '--tilt': `${((i * 37) % 7) - 3}deg` }}>
                  <blockquote>{w.message}</blockquote>
                  <figcaption>{w.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ---------- Today ---------- */}
      <section className={`container ${styles.today}`}>
        <Reveal className={styles.todayText}>
          <p className={styles.kicker}>Hôm nay</p>
          <h2 className={styles.display}>Xem ngày, <em>xem giờ</em>,<br />xem cả con giáp.</h2>
          <p>Lịch âm, ngày hoàng đạo, giờ tốt và tử vi hằng ngày cho 12 con giáp. Chọn con giáp của bạn một lần, lần sau vào là thấy.</p>
          <div className={styles.todayLinks}>
            <Link to="/fortune/lich#con-giap"><IoSparklesOutline /> Tử vi hôm nay</Link>
            <Link to="/fortune/numerology">Thần số học</Link>
            <Link to="/fortune/tu-vi">Lá số tử vi</Link>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <TodayAlmanacCard />
        </Reveal>
      </section>

      <ContinueReading className={`container ${styles.continue}`} />

      {/* ---------- Final call ---------- */}
      <section className="container">
        <Reveal className={styles.finale}>
          <div className={styles.finaleSeal} aria-hidden>囍</div>
          <h2>Ngày vui của bạn,<br /><em>bắt đầu từ một tấm thiệp.</em></h2>
          <p>Ba phút để tạo, một đường link để gửi. Miễn phí.</p>
          <div className={styles.heroActions}>
            <Link to="/events/create?type=wedding" className={styles.primary}>Tạo thiệp ngay <IoArrowForward /></Link>
            <Link to="/cuoi-hoi" className={styles.ghost}>Xem cách hoạt động</Link>
          </div>
        </Reveal>
      </section>

      {/* ---------- The author's corner ---------- */}
      <section className={`container ${styles.corner}`}>
        <div className={styles.cornerAbout}>
          <img src="/imgs/3 (2).jpg" alt="Sum Quốc" loading="lazy" />
          <p>
            <strong>Góc nhỏ của Sum Quốc.</strong> Người làm ra FollMe, thỉnh thoảng viết về phần mềm và vài câu chuyện đời thường.
          </p>
        </div>
        <ul className={styles.cornerList}>
          {corner.map(item => (
            <li key={item.key}>
              <Link to={item.to}>
                {item.icon}
                <span>{item.title}</span>
                <small>{item.kind} · {formatLongDate(item.at)}</small>
              </Link>
            </li>
          ))}
          <li className={styles.cornerMore}>
            <Link to="/blogs">Blog</Link>
            <Link to="/stories">Truyện</Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer"><IoLogoGithub /> GitHub</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
