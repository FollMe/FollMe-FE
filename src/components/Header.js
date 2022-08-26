import normalStyles from './NormalHeader.module.scss';
import mobileStyles from './MobileHeader.module.scss';
import { HEADER_TYPE } from "../config/enum";
import { useUserInfo } from 'customHooks/useUserInfo';
import UserMenu from './UserMenu';

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
                    {
                        Object.keys(userInfo).length !== 0 ?  <UserMenu picture={userInfo.avatar?.link} /> : <></>
                    }
                </div>
            </nav>
        </header>
    )
}