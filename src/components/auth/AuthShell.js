import { Link } from 'react-router-dom';
import BrandLogo from 'components/layout/BrandLogo';
import ThemeToggle from 'components/layout/ThemeToggle';
import styles from './AuthShell.module.scss';

const TERMS_URL = 'https://www.freeprivacypolicy.com/live/882e116b-73b8-4713-85a2-bbc173c68be0';

/**
 * Split-screen layout for the sign in / sign up pages.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className={styles.shell}>
      <div className={styles.formSide}>
        <div className={styles.topBar}>
          <BrandLogo />
          <ThemeToggle />
        </div>

        <div className={styles.formWrap}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>

        <div className={styles.legal}>
          <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
          <a href={TERMS_URL} target="_blank" rel="noreferrer">Terms & Conditions</a>
        </div>
      </div>

      <aside className={styles.brandSide}>
        <div className={styles.brandInner}>
          <span className={styles.seal} aria-hidden>囍</span>
          <p className={styles.eyebrow}>FollMe · Cưới hỏi</p>
          <h2 className={styles.headline}>
            Từ ngày hợp tuổi<br />đến <em>tấm thiệp</em> trao tay.
          </h2>
          <ul className={styles.points}>
            <li><strong>Xem tuổi & chọn ngày cưới</strong> theo lịch âm, tránh Kim Lâu.</li>
            <li><strong>Thiệp cưới online</strong> có phong bì, bản đồ, lịch và nhạc nền.</li>
            <li><strong>Xác nhận tham dự & sổ lưu bút</strong> gom về một chỗ.</li>
          </ul>
          <p className={styles.free}>Miễn phí · Không cần cài ứng dụng</p>
        </div>
      </aside>
    </div>
  )
}
