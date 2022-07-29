import clsx from "clsx";
import { useState, useEffect } from "react";
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import AddModeratorIcon from '@mui/icons-material/AddModerator';
import ImageCarousel from "components/ImageCarousel";

import styles from './SignIn.module.scss';



export default function SignUp() {
    const [showScrollImg, setShowScrollImg] = useState(true);

    useEffect(() => {
        document.title = "Đăng kí | FollMe";
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                setShowScrollImg(false);
            } else {
                setShowScrollImg(true);
            }
        })
    }, [])
    const [message] = useState('');

    return (
        <div className="containerMain">
            <div className="sideFeature mainSide">
                <div className={styles.introTitle}>Tạo tài khoản dễ dàng</div>
                <div className={styles.titleMethod}><hr />Đăng kí bằng email<hr /></div>
                <div className={styles.login}>
                    <form id="form-login" action="sign-up" method="POST" className={styles.loginForm}>
                        <div className={styles.loginForm_Text}>
                            <div className={styles.notifyInput}>{message}</div>
                            <EmailIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                            <input className={styles.inputField} name="email" type="text" placeholder="Tài khoản email" required />

                        </div>
                        <div className={styles.loginForm_Text}>
                            <div className={styles.notifyInput}></div>
                            <AddModeratorIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                            <i className="fas fa-shield-alt font-icon"></i>
                            <span className={styles.btnSendCode}>Nhận mã</span>
                            <div className={styles.ctnFunction}></div>
                            <input className={styles.inputField} name="code" type="number" step="1" placeholder="Mã xác thực" />

                        </div>
                        <div className={styles.loginForm_Text}>
                            <div className={styles.notifyInput}></div>
                            <LockIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                            <input className={styles.inputField} name="password" type="password" placeholder="Mật khẩu" />
                        </div>

                        <div className={styles.loginForm_Submit}>
                            <input type="button" value="Đăng kí" />
                        </div>
                    </form>

                </div>
                <div className={styles.loginFoot}>
                    Đã có tài khoản, vui lòng <a href="/sign-in">đăng nhập</a>
                </div>
                <div className={styles.titleMethod}><hr />Hoặc đăng nhập bằng<hr /></div>
                <div className={styles.login}>
                    <a className={styles.divButton} href="/auth/facebook">
                        <div className={clsx(styles.svg, styles.fbLogin)}>
                            <svg xmlns="http://www.w3.org/20svg" viewBox="0 0 216 216" className="_5h0m" color="#FFFFFF">
                                <path fill="#FFFFFF" d="M204.1 0H11.9C5.3 0 0 5.3 0 11.9v192.2c0 6.6 5.3 11.9 11.9
                        11.9h103.5v-83.6H87.2V99.8h28.1v-24c0-27.9 17-43.1 41.9-43.1
                        11.9 0 22.2.9 25.2 1.3v29.2h-17.3c-13.5 0-16.2 6.4-16.2
                        15.9v20.8h32.3l-4.2 32.6h-28V216h55c6.6 0 11.9-5.3
                        11.9-11.9V11.9C216 5.3 210.7 0 204.1 0z">
                                </path>
                            </svg>
                        </div>
                    </a>
                    <a className={styles.divButton} href="/auth/google">
                        <div className={clsx(styles.svg, styles.googleLogin)}>
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 48 48" className="abcRioButtonSvg">
                                <g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z">
                                </path>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z">
                                    </path>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z">
                                    </path>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z">
                                    </path>
                                    <path fill="none" d="M0 0h48v48H0z">
                                    </path></g>
                            </svg>
                        </div>
                    </a>
                </div>

                <img
                    className={clsx("arrowDownIcon", {
                        "arrowDownIconHide": !showScrollImg
                    })}
                    src="imgs/scroll-down.gif"
                    alt="arrow down"
                />

            </div>
            <div className="sideIntro mainSide">
                <div className={styles.containerCarousel}>
                    <ImageCarousel />
                </div>
            </div>
        </div>
    )
}