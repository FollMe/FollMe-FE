import { Link } from 'react-router-dom';
import { IoLogoGithub, IoArrowUp } from 'react-icons/io5';
import BrandLogo from 'components/layout/BrandLogo';
import styles from './Footer.module.scss';

const PRIVACY_POLICY_URL = 'https://www.freeprivacypolicy.com/live/b2e00735-5907-4d28-9a1a-875d2f56053c';
const TERMS_URL = 'https://www.freeprivacypolicy.com/live/882e116b-73b8-4713-85a2-bbc173c68be0';
const GITHUB_URL = 'https://github.com/sumsv50';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.about}>
          <BrandLogo />
          <p className={styles.tagline}>
            Nơi chia sẻ những bài viết về lập trình, những câu chuyện đời thường
            và những lời mời gửi đến người thân yêu.
          </p>
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h3>Khám phá</h3>
            <Link to="/blogs">Blog</Link>
            <Link to="/stories">Truyện</Link>
            <Link to="/events">Thư mời điện tử</Link>
          </div>
          <div className={styles.column}>
            <h3>Kết nối</h3>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <IoLogoGithub /> GitHub
            </a>
          </div>
          <div className={styles.column}>
            <h3>Pháp lý</h3>
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">Privacy Policy</a>
            <a href={TERMS_URL} target="_blank" rel="noreferrer">Terms & Conditions</a>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} FollMe · Thiết kế & phát triển bởi Sum Quốc</span>
        <button type="button" className={styles.toTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Lên đầu trang <IoArrowUp />
        </button>
      </div>
    </footer>
  )
}
