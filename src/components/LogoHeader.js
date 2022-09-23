import { Link } from 'react-router-dom';
import styles from './NormalHeader.module.scss';

export default function LogoHeader() {
    return (
        <header className={styles.headerOnlyLogo}>
            <nav className={styles.navbarOnlyLogo}>
                <Link to="/"><img src="/imgs/follme-logo.png" alt="FollMe Logo" className={styles.navOnlyLogo} /></Link>
                <h1>FollMe</h1>
            </nav>
        </header>
    )
}