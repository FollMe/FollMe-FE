import styles from './AuthHeader.module.scss';

export default function AuthHeader() {
    return (
        <header>
            <nav className={styles.navbarMe}>
                <a href="/"><img src="/imgs/follme-logo.png" alt="FollMe Logo" className={styles.navLogo} /></a>
                <h1>FollMe</h1>
                <div className="user-box">
                    <span className="user-name">
                        quoc-sum
                    </span>
                    <img src="/img/user.svg" alt="FollMe Logo" className="nav-avt" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false"
                        onError={({ currentTarget }) => {
                            currentTarget.onerror = null;
                            currentTarget.src = "/imgs/user.svg";
                        }}
                    />
                    {/* <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                        <li><a class="dropdown-item" href="/logout">Đăng xuất</a></li>
                    </ul> */}
                </div>
            </nav>
        </header>
    )
}