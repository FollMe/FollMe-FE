import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import {
  IoArrowForward, IoNewspaperOutline, IoLibraryOutline, IoTicketOutline, IoLogoGithub, IoSparklesOutline,
} from 'react-icons/io5';
import BlogItem from 'components/blog/BlogItem';
import StoryItem from 'components/story/StoryItem';
import { PostCardSkeleton } from 'components/cards/PostCard';
import Reveal from 'components/Reveal';
import { useUserInfo } from 'customHooks/useUserInfo';
import { handleCheckLoggedIn } from 'util/authHelper';
import { request } from 'util/request';
import styles from './Home.module.scss';

const GITHUB_URL = 'https://github.com/sumsv50';

const FEATURES = [
  {
    to: '/blogs',
    icon: <IoNewspaperOutline />,
    title: 'Blog kỹ thuật',
    description: 'Ghi chép về thiết kế cơ sở dữ liệu, giao thức web, Git và những bài học rút ra khi làm phần mềm.',
    cta: 'Đọc blog',
  },
  {
    to: '/stories',
    icon: <IoLibraryOutline />,
    title: 'Truyện dài & ngắn',
    description: 'Những câu chuyện được kể theo từng chương, kèm bình luận theo thời gian thực cùng người đọc.',
    cta: 'Khám phá truyện',
  },
  {
    to: '/events',
    icon: <IoTicketOutline />,
    title: 'Thư mời điện tử',
    description: 'Tạo sự kiện, gửi thư mời riêng cho từng khách qua email, kèm mã QR và theo dõi lượt xem.',
    cta: 'Tạo thư mời',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [userInfo] = useUserInfo();
  const [blogs, setBlogs] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedIn = useMemo(() => handleCheckLoggedIn(userInfo.sessionExp), [userInfo]);

  useEffect(() => {
    document.title = "FollMe — Chia sẻ câu chuyện của bạn";
    getContent();

    async function getContent() {
      try {
        const [blogRes, storyRes] = await Promise.all([
          request.get('api/blogs'),
          request.get('api/stories'),
        ]);
        const blogs = Array.isArray(blogRes?.blogs) ? blogRes.blogs : [];
        const stories = Array.isArray(storyRes?.stories) ? storyRes.stories : [];
        setBlogs(blogs);
        setStories(stories);
        populateNumsOfCmt(stories);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [])

  async function populateNumsOfCmt(stories) {
    if (stories.length === 0) {
      return;
    }
    try {
      const res = await request.post('comment-svc/api/comments/count', {
        postSlugs: stories.map(story => story.slug)
      });
      const numsOfCmt = res?.numsOfCmt ?? {};
      setStories(current => current.map(story => ({ ...story, numsOfCmt: numsOfCmt[story.slug] })));
    } catch (err) {
      console.log(err);
    }
  }

  const [latestBlog, ...otherBlogs] = blogs;
  const totalViews = blogs.reduce((sum, blog) => sum + (blog.viewed ?? 0), 0);

  return (
    <div className={styles.home}>
      {/* ---------- Hero ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden />
        <div className={`container ${styles.heroInner}`}>
          <div>
            <span className={`${styles.pill} fade-up`}>
              <IoSparklesOutline /> Blog · Truyện · Thư mời điện tử
            </span>
            <h1 className={`${styles.heroTitle} fade-up`} style={{ animationDelay: '80ms' }}>
              Viết code, kể chuyện <em>và</em> lưu giữ những điều đáng nhớ.
            </h1>
            <p className={`${styles.heroLead} fade-up`} style={{ animationDelay: '160ms' }}>
              FollMe là góc nhỏ của mình trên Internet — nơi ghi lại những bài học khi làm phần mềm,
              những câu chuyện đời thường và cả những lời mời gửi đến người thân yêu.
            </p>
            <div className={`${styles.heroActions} fade-up`} style={{ animationDelay: '240ms' }}>
              <Button variant="contained" size="large" endIcon={<IoArrowForward />} onClick={() => navigate('/blogs')}>
                Đọc blog
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/stories')}>
                Khám phá truyện
              </Button>
            </div>
            <dl className={`${styles.stats} fade-up`} style={{ animationDelay: '320ms' }}>
              <div>
                <dt>Bài viết</dt>
                <dd>{isLoading ? '–' : blogs.length}</dd>
              </div>
              <div>
                <dt>Truyện</dt>
                <dd>{isLoading ? '–' : stories.length}</dd>
              </div>
              <div>
                <dt>Lượt đọc blog</dt>
                <dd>{isLoading ? '–' : totalViews.toLocaleString('vi-VN')}</dd>
              </div>
            </dl>
          </div>

          <div className={`${styles.heroCard} fade-up`} style={{ animationDelay: '200ms' }}>
            <div className={styles.heroCardGlow} aria-hidden />
            {otherBlogs[0] && <div className={styles.heroCardBehind} aria-hidden style={{ backgroundImage: `url(${otherBlogs[0].thumbnail?.link})` }} />}
            <div className={styles.heroCardFront}>
              {isLoading ? <PostCardSkeleton /> : latestBlog && <BlogItem blog={latestBlog} />}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Latest blogs ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHead}>
          <div>
            <div className="eyebrow">Blog</div>
            <h2 className={styles.sectionTitle}>Bài viết gần đây</h2>
          </div>
          <Link to="/blogs" className={styles.seeAll}>Xem tất cả <IoArrowForward /></Link>
        </Reveal>
        <div className="card-grid">
          {isLoading
            ? [0, 1, 2].map(i => <PostCardSkeleton key={i} />)
            : otherBlogs.slice(0, 3).map((blog, index) => (
              <Reveal key={blog._id} delay={index * 80}>
                <BlogItem blog={blog} />
              </Reveal>
            ))}
        </div>
      </section>

      {/* ---------- Stories ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHead}>
          <div>
            <div className="eyebrow">Truyện</div>
            <h2 className={styles.sectionTitle}>Góc truyện</h2>
          </div>
          <Link to="/stories" className={styles.seeAll}>Tất cả truyện <IoArrowForward /></Link>
        </Reveal>
        <div className="card-grid">
          {isLoading
            ? [0, 1].map(i => <PostCardSkeleton key={i} />)
            : stories.slice(0, 3).map((story, index) => (
              <Reveal key={story._id} delay={index * 80}>
                <StoryItem story={story} />
              </Reveal>
            ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHeadCenter}>
          <div className="eyebrow">FollMe có gì?</div>
          <h2 className={styles.sectionTitle}>Một nơi cho mọi câu chuyện</h2>
        </Reveal>
        <div className={styles.features}>
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.to} delay={index * 90}>
              <Link to={feature.to} className={styles.feature}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className={styles.featureCta}>{feature.cta} <IoArrowForward /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.about}>
          <div className={styles.aboutPhoto}>
            <img src="/imgs/3 (2).jpg" alt="Sum Quốc" loading="lazy" />
          </div>
          <div className={styles.aboutText}>
            <div className="eyebrow">Về tác giả</div>
            <h2 className={styles.sectionTitle}>Xin chào, mình là Sum Quốc.</h2>
            <blockquote className={styles.quote}>
              “Tôi cảm thấy tự hào khi được chia sẻ câu chuyện của mình đến với mọi người!”
            </blockquote>
            <p>
              Một lập trình viên thích viết. FollMe là dự án cá nhân mình tự thiết kế và xây dựng —
              từ giao diện React cho tới các dịch vụ backend phía sau — để có một nơi lưu giữ
              kiến thức, những câu chuyện và kết nối với mọi người.
            </p>
            <div className={styles.aboutActions}>
              <Button variant="outlined" startIcon={<IoLogoGithub />} href={GITHUB_URL} target="_blank" rel="noreferrer">
                GitHub
              </Button>
              <Button variant="text" endIcon={<IoArrowForward />} onClick={() => navigate('/blogs')}>
                Đọc bài viết của mình
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- CTA ---------- */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.cta}>
          <img src="/imgs/follme-logo.png" alt="" className={styles.ctaMark} />
          <h2>Bạn cũng có câu chuyện muốn kể?</h2>
          <p>Tham gia FollMe để bình luận, viết blog và gửi thư mời điện tử cho sự kiện của riêng bạn.</p>
          <Button
            variant="contained"
            size="large"
            className={styles.ctaButton}
            endIcon={<IoArrowForward />}
            onClick={() => navigate(isLoggedIn ? '/blogs/create' : '/sign-up')}
          >
            {isLoggedIn ? 'Viết bài ngay' : 'Tạo tài khoản miễn phí'}
          </Button>
        </Reveal>
      </section>
    </div>
  )
}
