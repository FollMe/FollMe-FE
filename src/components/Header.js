import normalStyles from './NormalHeader.module.scss';
import mobileStyles from './MobileHeader.module.scss';
import { HEADER_TYPE } from "../config/enum";
import { useUserInfo } from 'customHooks/useUserInfo';

export default function Header({ type }) {
    const [ userInfo ] = useUserInfo();
    let styles = normalStyles;
    if (type === HEADER_TYPE.MOBILE) {
        styles = mobileStyles;
    }
    return (
        <header>
            <nav className={styles.navbarMe}>
                <a href="/"><img src="/imgs/follme-logo.png" alt="FollMe Logo" className={styles.navLogo} /></a>
                <h1>FollMe</h1>
                <div className="user-box">
                    <span className="user-name">
                        {userInfo.slEmail}
                    </span>
                    <img src={userInfo.avatar.link} alt="FollMe Logo" className="nav-avt" id="dropdownMenuButton1" data-bs-toggle="dropdown"
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