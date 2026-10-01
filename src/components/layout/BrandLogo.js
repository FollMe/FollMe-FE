import { Link } from 'react-router-dom';
import clsx from 'clsx';
import styles from './BrandLogo.module.scss';

/** A red lacquer seal (con dấu) and the FollMe wordmark. */
export default function BrandLogo({ className, onClick, size = 'md' }) {
  return (
    <Link to="/" className={clsx(styles.brand, styles[size], className)} onClick={onClick} aria-label="FollMe, trang chủ">
      <span className={styles.mark} aria-hidden>F</span>
      <span className={styles.word}>Foll<em>Me</em></span>
    </Link>
  )
}
