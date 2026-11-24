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
            Ghi chép của một backend engineer về thanh toán và ví điện tử ở Việt Nam:
            sau mỗi bước tiền đi đâu, order ở state nào, và khi một bên im lặng thì làm gì.
          </p>
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h2>Đọc</h2>
            <Link to="/fintech">Kiến thức fintech</Link>
            <Link to="/blogs">Blog</Link>
            <Link to="/stories">Truyện</Link>
            <Link to="/doc-sau">Đọc sau</Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <IoLogoGithub /> GitHub
            </a>
          </div>
          <div className={styles.column}>
            <h2>Góc nhỏ</h2>
            <Link to="/cuoi-hoi">Thiệp cưới online</Link>
            <Link to="/fortune/hop-tuoi">Xem tuổi hợp nhau</Link>
            <Link to="/cuoi-hoi/chon-ngay">Chọn ngày cưới</Link>
            <Link to="/fortune/lich">Lịch vạn niên</Link>
            <Link to="/events">Thiệp của tôi</Link>
          </div>
          <div className={styles.column}>
            <h2>Pháp lý</h2>
            <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
            <a href={TERMS_URL} target="_blank" rel="noreferrer">Terms & Conditions</a>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} FollMe · Viết và phát triển bởi Quốc Sum</span>
        <button type="button" className={styles.toTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Lên đầu trang <IoArrowUp />
        </button>
      </div>
    </footer>
  )
}
