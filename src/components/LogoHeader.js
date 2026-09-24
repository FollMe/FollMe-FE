import BrandLogo from 'components/layout/BrandLogo';
import ThemeToggle from 'components/layout/ThemeToggle';
import styles from './LogoHeader.module.scss';

export default function LogoHeader() {
    return (
        <header className={styles.header}>
            <div className={`container ${styles.inner}`}>
                <BrandLogo />
                <ThemeToggle />
            </div>
        </header>
    )
}
