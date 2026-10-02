import { Link } from 'react-router-dom';
import { IoLogoGithub, IoArrowUp } from 'react-icons/io5';
import BrandLogo from 'components/layout/BrandLogo';
import styles from './Footer.module.scss';

const TERMS_URL = 'https://www.freeprivacypolicy.com/live/882e116b-73b8-4713-85a2-bbc173c68be0';
const GITHUB_URL = 'https://github.com/sumsv50';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.about}>
          <BrandLogo />
          <p className={styles.tagline}>
            Xem tuổi, chọn ngày cưới và gửi thiệp cưới online, cùng lịch vạn niên
            và tử vi hằng ngày cho những ngày quan trọng của bạn.
          </p>
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h3>Cưới hỏi</h3>
            <Link to="/fortune/hop-tuoi">Xem tuổi hợp nhau</Link>
            <Link to="/cuoi-hoi/chon-ngay">Chọn ngày cưới</Link>
            <Link to="/cuoi-hoi">Thiệp cưới online</Link>
            <Link to="/events">Thiệp của tôi</Link>
          </div>
          <div className={styles.column}>
            <h3>Xem ngày</h3>
            <Link to="/fortune/lich">Lịch vạn niên</Link>
            <Link to="/fortune/lich#con-giap">Tử vi hôm nay</Link>
            <Link to="/fortune/numerology">Thần số học</Link>
            <Link to="/fortune/tu-vi">Lá số tử vi</Link>
          </div>
          <div className={styles.column}>
            <h3>Góc nhỏ</h3>
            <Link to="/blogs">Blog</Link>
            <Link to="/stories">Truyện</Link>
            <Link to="/doc-sau">Đọc sau</Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <IoLogoGithub /> GitHub
            </a>
          </div>
          <div className={styles.column}>
            <h3>Pháp lý</h3>
            <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
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
