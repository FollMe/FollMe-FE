import clsx from "clsx";
import { useState, useEffect } from "react"
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import { toast } from 'react-toastify';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LoadingIcons from 'react-loading-icons'
import styles from './SignIn.module.scss';
import ImageCarousel from "components/ImageCarousel";

import { useUserInfo } from "customHooks/useUserInfo";
import { request, authRouteList } from "util/request";
import { handleCheckLoggedIn } from "util/authHelper";

const validate = (values) => {
  const errors = {};

  if (!values.email) {
    errors.email = 'Vui lòng nhập email';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Email không hợp lệ';
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  } else if (values.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 kí tự';
  }

  return errors;
};

export default function SignIn() {
  const navigate = useNavigate();
  const [showScrollImg, setShowScrollImg] = useState(true);
  const [userInfo, setUserInfo] = useUserInfo();
  const [isOauthGoogleLoading, setIsOauthGoogleLoading] = useState(false);
  const [isAuthLocalLoading, setIsAuthLocalLoading] = useState(false);
  const [message] = useState('');

  useEffect(() => {
    document.title = "Đăng nhập | FollMe";
    const isLoggedIn = handleCheckLoggedIn(userInfo.sessionExp)

    if (isLoggedIn) {
      return navigate('/');
    }
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        setShowScrollImg(false);
      } else {
        setShowScrollImg(true);
      }
    })

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: oauthGoogleCallback,
      })
      window.google.accounts.id.prompt();
      window.google.accounts.id.renderButton(
        document.getElementById("login-google-button"), {
        type: "icon"
      }
      )
    }
  }, [])

  async function oauthGoogleCallback(res) {
    try {
      if (!res || !res.credential) {
        toast.error("Xảy ra lỗi, vui lòng thử lại!");
        return;
      }
      setIsOauthGoogleLoading(true);
      const userInfo = await request.authenticate(authRouteList.google, { idToken: res.credential });
      setIsOauthGoogleLoading(false);
      if (userInfo) {
        setUserInfo(userInfo);
        navigate(window.sessionStorage.getItem('redirect') ?? '/');
        window.sessionStorage.removeItem('redirect');
      }
    } catch (err) {
      console.log(err);
      setIsOauthGoogleLoading(false);
    }
  }

  async function authLocalCallback({ email, password }) {
    try {
      setIsAuthLocalLoading(true);
      const userInfo = await request.authenticate(authRouteList.local, { email, password });
      setIsAuthLocalLoading(false);
      if (userInfo) {
        setUserInfo(userInfo);
        navigate(window.sessionStorage.getItem('redirect') ?? '/');
        window.sessionStorage.removeItem('redirect');
      }
    } catch (err) {
      console.log(err);
      setIsAuthLocalLoading(false);
    }
  }

  return (
    <div className="containerMain">
      <div className="sideFeature mainSide">
        <div className={styles.introTitle}> Chào mừng bạn </div>
        <div className={styles.titleMethod}><hr /> Đăng nhập bằng email <hr /></div>
        <div className={styles.login}>
          <Formik
            initialValues={{
              email: '',
              password: '',
            }}
            onSubmit={authLocalCallback}
            validate={validate}
          >
            {() => (
              <Form id="login-form" method="post" className={styles.loginForm}>
                <div className={styles.loginForm_Text}>
                  <div className={styles.notifyInput}> {message} </div>
                  <EmailIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                  <Field name="email" className={clsx(styles.inputField)} type="text" placeholder="Tài khoản email" />
                  <ErrorMessage name="email" render={msg => <div className="txtErrorInput">{msg}</div>} />
                </div>
                <div className={styles.loginForm_Text}>
                  <div className={styles.notifyInput}> {message} </div>
                  <LockIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                  <Field className={styles.inputField} name="password" type="password" placeholder="Mật khẩu" />
                  <ErrorMessage name="password" render={msg => <div className="txtErrorInput">{msg}</div>} />
                </div>
                <div className={styles.loginFormRMB}>
                  <div className={styles.formGroup}>
                    <Field type="checkbox" name="isRemember" />
                    <label htmlFor="isRemember">Lưu trạng thái</label>
                  </div>
                  <div className={styles.titleForgetPassword}>Quên mật khẩu</div>
                </div>
                <div className={styles.loginForm_Submit}>
                  <button type="submit" disabled={isAuthLocalLoading}>
                    {isAuthLocalLoading ? <LoadingIcons.TailSpin style={{ width: 30 }} /> : "Đăng nhập"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

        </div>
        <div className={styles.loginFoot}>
          Nếu chưa có tài khoản, vui lòng <Link to="/sign-up"> đăng kí </Link>
        </div>
        <div className={styles.titleMethod}><hr />Hoặc đăng nhập bằng<hr /></div>
        <div className={styles.login}>
          <div
            id="login-google-button"
            className={clsx(styles.svg, styles.googleLogin, styles.oauthButton)}
            style={{ display: isOauthGoogleLoading ? "none" : "inline-block" }}
          >
          </div>
          {
            isOauthGoogleLoading ? (
              <div className={clsx(styles.svg, styles.googleLogin, styles.oauthButton)} style={{ border: "solid 0.4px #9d9d9d" }}>
                <LoadingIcons.TailSpin stroke="red" style={{ top: 1 }} />
              </div>
            ) : null
          }
        </div>
        <div className={styles.documents}>
          <a
            href="https://www.freeprivacypolicy.com/live/b2e00735-5907-4d28-9a1a-875d2f56053c"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
          <a
            href="https://www.freeprivacypolicy.com/live/882e116b-73b8-4713-85a2-bbc173c68be0"
            target="_blank"
            rel="noreferrer"
          >
            Terms & Conditions
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
