import { Link } from 'react-router-dom';
import clsx from 'clsx';
import styles from './BrandLogo.module.scss';

export default function BrandLogo({ className, onClick, size = 'md' }) {
  return (
    <Link to="/" className={clsx(styles.brand, styles[size], className)} onClick={onClick} aria-label="FollMe — Trang chủ">
      <img src="/imgs/follme-logo.png" alt="" className={styles.mark} />
      <span className={styles.word}>Foll<span>Me</span></span>
    </Link>
  )
}
