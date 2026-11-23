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
          <span className={styles.seal} aria-hidden>F<i /></span>
          <p className={styles.eyebrow}>~/follme · engineering notes</p>
          <h2 className={styles.headline}>
            Thanh toán,<br />giải thích <em>từng bước</em>.
          </h2>
          <ul className={styles.points}>
            <li><strong>Kiến thức fintech</strong>: luồng tiền vẽ thành sequence chạy được và state machine.</li>
            <li><strong>Blog</strong>: viết bài, thả tim, bình luận theo thời gian thực.</li>
            <li><strong>Đọc sau</strong>: lưu bài và đọc tiếp ở bất kỳ thiết bị nào.</li>
          </ul>
          <p className={styles.free}>Góc nhỏ: thiệp cưới online, xem tuổi, chọn ngày vẫn ở đây.</p>
        </div>
      </aside>
    </div>
  )
}
