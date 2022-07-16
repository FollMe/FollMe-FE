import styles from './AuthHeader.module.scss';

export default function AuthHeader() {
  return (
    <header>
      <nav className={styles.navbarMe}>
        <a href="/"><img src="/imgs/follme-logo.png" alt="FollMe Logo" className={styles.navLogo} /></a>
        <h1>FollMe</h1>
      </nav>
    </header>
  )
}