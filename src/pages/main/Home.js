import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  IoArrowForward, IoLogoGithub, IoTicketOutline, IoHeartOutline, IoCalendarOutline, IoSparklesOutline,
} from 'react-icons/io5';
import Reveal from 'components/Reveal';
import BlogItem from 'components/blog/BlogItem';
import { PostCardSkeleton } from 'components/cards/PostCard';
import ContinueReading from 'components/reading/ContinueReading';
import { FINTECH_ARTICLES } from 'fintech/articles';
import { FLOWS } from 'fintech/savingsFund';
import { prefersReducedMotion } from 'components/fintech/usePlayer';
import { setPageMeta } from 'util/meta';
import { request } from 'util/request';
import styles from './Home.module.scss';

const GITHUB_URL = 'https://github.com/sumsv50';

const CORNER = [
  { to: '/cuoi-hoi', label: 'Thiệp cưới online', icon: <IoTicketOutline /> },
  { to: '/fortune/hop-tuoi', label: 'Xem tuổi hợp nhau', icon: <IoHeartOutline /> },
  { to: '/cuoi-hoi/chon-ngay', label: 'Chọn ngày cưới', icon: <IoCalendarOutline /> },
  { to: '/fortune/lich', label: 'Lịch vạn niên', icon: <IoSparklesOutline /> },
];

const HAPPY = FLOWS.deposit.scenarios.find(s => s.id === 'happy').path;

/**
 * A terminal that tails the order log of a deposit, one transition at a
 * time, then starts over. The hero's way of saying what the site is about.
 */
function OrderLog() {
  const [shown, setShown] = useState(prefersReducedMotion() ? HAPPY.length : 1);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const timer = setTimeout(() => setShown(n => (n >= HAPPY.length + 2 ? 1 : n + 1)), shown > HAPPY.length ? 2400 : 1100);
    return () => clearTimeout(timer);
  }, [shown]);

  const lines = HAPPY.slice(0, Math.min(shown, HAPPY.length));
  const done = shown >= HAPPY.length;

  return (
    <div className={styles.terminal} aria-label="Log trạng thái của một order nộp tiền" role="img">
      <div className={styles.termBar}>
        <i /><i /><i />
        <span>orders · deposit · order_ref=0193a…7f</span>
      </div>
      <ol className={styles.termBody}>
        {lines.map(([state, note], i) => (
          <li key={state} className={clsx(i === lines.length - 1 && !done && styles.termLast)}>
            <span className={styles.termTime}>{`12:00:${String(i * 2 + 1).padStart(2, '0')}`}</span>
            <span className={clsx(styles.termState, state === 'COMPLETED' && styles.termOk)}>{state}</span>
            <span className={styles.termNote}>{note}</span>
          </li>
        ))}
        {!done && <li className={styles.cursor} aria-hidden="true"><span>▍</span></li>}
      </ol>
    </div>
  );
}

export default function Home() {
  const [blogs, setBlogs] = useState(null);

  useEffect(() => {
    setPageMeta({
      title: null,
      description: 'Ghi chép của một backend engineer về thanh toán và ví điện tử ở Việt Nam: luồng tiền vẽ thành sequence chạy từng bước, state machine, idempotency và reconciliation.',
    });

    request.get('api/blogs')
      .then(res => setBlogs(Array.isArray(res?.blogs) ? res.blogs : []))
      .catch(() => setBlogs([]));
  }, []);

  const latest = (blogs ?? [])
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <p className={clsx('eyebrow', styles.path, 'fade-up')}>~/follme · engineering notes</p>
            <h1 className={clsx(styles.heroTitle, 'fade-up')} style={{ animationDelay: '80ms' }}>
              Thanh toán,<br />giải thích <span>từng bước</span>.
            </h1>
            <p className={clsx(styles.heroLead, 'fade-up')} style={{ animationDelay: '160ms' }}>
              Mình là backend engineer, đang làm ví điện tử ở Việt Nam. Ở đây mình vẽ lại từng luồng tiền thành
              sequence chạy được và state machine, để thấy tiền đang nằm ở đâu, order ở state nào, và khi một bên
              im lặng thì mình làm gì.
            </p>
            <div className={clsx(styles.heroActions, 'fade-up')} style={{ animationDelay: '240ms' }}>
              <Link to="/fintech/savings-fund" className={styles.primary}>
                Xem flow nộp/rút quỹ <IoArrowForward />
              </Link>
              <Link to="/blogs" className={styles.ghost}>Đọc blog</Link>
            </div>
            <ul className={clsx(styles.topics, 'fade-up')} style={{ animationDelay: '320ms' }}>
              {['Money movement', 'State machine', 'Idempotency', 'Reconciliation', 'Go · gRPC'].map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div className={clsx(styles.heroVisual, 'fade-up')} style={{ animationDelay: '200ms' }}>
            <OrderLog />
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHead}>
          <div>
            <div className="eyebrow">Fintech</div>
            <h2>Kiến thức fintech</h2>
          </div>
          <Link to="/fintech" className={styles.all}>Tất cả <IoArrowForward /></Link>
        </Reveal>
        <div className={styles.featuredGrid}>
          {FINTECH_ARTICLES.map(a => (
            <Reveal key={a.slug}>
              <Link to={a.to} className={styles.featured}>
                <div className={styles.featuredText}>
                  <span className={styles.featuredTag}>{a.tag}</span>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <span className={styles.featuredCta}>Đọc bài <IoArrowForward /></span>
                </div>
                <div className={styles.featuredArt} aria-hidden="true">
                  {a.ladder.map((s, i) => (
                    <span key={s} style={{ '--i': i }}>{s}</span>
                  ))}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHead}>
          <div>
            <div className="eyebrow">Blog</div>
            <h2>Bài viết mới</h2>
          </div>
          <Link to="/blogs" className={styles.all}>Tất cả bài viết <IoArrowForward /></Link>
        </Reveal>
        {blogs === null ? (
          <div className="card-grid"><PostCardSkeleton /><PostCardSkeleton /><PostCardSkeleton /></div>
        ) : latest.length > 0 ? (
          <div className="card-grid">
            {latest.map(blog => <BlogItem key={blog._id} blog={blog} />)}
          </div>
        ) : (
          <p className="empty-state">Chưa tải được bài viết. <Link to="/blogs">Mở trang blog</Link></p>
        )}
      </section>

      <ContinueReading className={`container ${styles.section}`} />

      <section className={`container ${styles.section}`}>
        <div className={styles.bottomGrid}>
          <Reveal className={styles.about}>
            <img src="/imgs/3 (2).jpg" alt="Quốc Sum" loading="lazy" />
            <div>
              <div className="eyebrow">Về mình</div>
              <p>
                Mình là <strong>Quốc Sum</strong>, backend engineer (Go, gRPC, GCP), đang làm ví điện tử và thanh toán.
                Trang này là chỗ mình ghi lại những gì học được, trước là để mình đọc lại, sau là để ai cần thì dùng chung.
              </p>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={styles.all}><IoLogoGithub /> GitHub</a>
            </div>
          </Reveal>
          <Reveal className={styles.corner} delay={80}>
            <div className="eyebrow">Góc nhỏ</div>
            <p>Mấy công cụ cưới hỏi mình từng làm cho bạn bè, giờ vẫn dùng được:</p>
            <ul>
              {CORNER.map(c => (
                <li key={c.to}><Link to={c.to}>{c.icon} {c.label}</Link></li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
