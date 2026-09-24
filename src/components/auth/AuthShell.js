import BrandLogo from 'components/layout/BrandLogo';
import ThemeToggle from 'components/layout/ThemeToggle';
import styles from './AuthShell.module.scss';

const PRIVACY_POLICY_URL = 'https://www.freeprivacypolicy.com/live/b2e00735-5907-4d28-9a1a-875d2f56053c';
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
          <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">Privacy Policy</a>
          <a href={TERMS_URL} target="_blank" rel="noreferrer">Terms & Conditions</a>
        </div>
      </div>

      <aside className={styles.brandSide}>
        <div className={styles.brandInner}>
          <img src="/imgs/follme-logo.png" alt="" className={styles.brandMark} />
          <figure className={styles.quote}>
            <blockquote>
              “Tôi cảm thấy tự hào khi được chia sẻ câu chuyện của mình đến với mọi người!”
            </blockquote>
            <figcaption>
              <img src="/imgs/3 (2).jpg" alt="" />
              <span>
                <strong>Sum Quốc</strong>
                Tác giả FollMe
              </span>
            </figcaption>
          </figure>
          <ul className={styles.points}>
            <li>Đọc blog kỹ thuật & truyện dài kỳ</li>
            <li>Bình luận theo thời gian thực</li>
            <li>Tạo thư mời điện tử cho sự kiện của bạn</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
