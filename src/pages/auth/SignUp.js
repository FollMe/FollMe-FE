import clsx from "clsx";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Field, ErrorMessage, Form } from 'formik';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import AddModeratorIcon from '@mui/icons-material/AddModerator';
import LoadingIcons from 'react-loading-icons'
import { toast } from 'react-toastify';
import { request, authRouteList } from "util/request";
import ImageCarousel from "components/ImageCarousel";
import { useUserInfo } from "customHooks/useUserInfo";
import { handleCheckLoggedIn } from "util/authHelper";

import styles from './SignIn.module.scss';

// unit: second
const REQUEST_CODE_INTERVAL = 30;

const validate = (values) => {
  const errors = {};

  if (!values.code) {
    errors.code = 'Yêu cầu mã xác thực';
  }

  if (!values.password) {
    errors.password = 'Yêu cầu mật khẩu';
  } else if (values.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 kí tự';
  }

  return errors;
};

export default function SignUp() {
  const navigate = useNavigate();
  const [showScrollImg, setShowScrollImg] = useState(true);
  const [userInfo, setUserInfo] = useUserInfo();
  const [isOauthGoogleLoading, setIsOauthGoogleLoading] = useState(false);
  const [isRequestCodeLoading, setIsRequestCodeLoading] = useState(false);
  const [isRequestSignUpLoading, setIsRequestSignUpLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [waitTime, setWaitTime] = useState(0);
  const isValidEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email);
  const isLoggedIn = handleCheckLoggedIn(userInfo.sessionExp)

  useEffect(() => {
    document.title = "Đăng kí | FollMe";

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

    // Init Google Oauth
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

  async function signUpLocalCallback(data) {
    try {
      setIsRequestSignUpLoading(true);
      data.email = email;
      await request.post('api/auth/sign-up', data);
      setIsRequestSignUpLoading(false);
      toast.success("Đăng kí tài khoản thành công, vui lòng đăng nhập");

      setTimeout(() => {
        navigate('/sign-in');
      }, 4000);
    } catch (err) {
      console.log(err);
      setIsRequestSignUpLoading(false);
    }
  }

  async function handRequestGetCode() {
    try {
      setIsRequestCodeLoading(true);
      await request.post('api/auth/code', { email });
      setIsRequestCodeLoading(false);
      countDownRequestTime();
      toast.success("Đã gửi mã đến email của bạn");
    } catch (err) {
      console.log(err);
      setIsRequestCodeLoading(false);
    }
  }

  function countDownRequestTime() {
    setWaitTime(REQUEST_CODE_INTERVAL);
    const threadId = setInterval(() => {
      setWaitTime(waitTime => {
        if (waitTime <= 0) {
          clearInterval(threadId);
          return 0;
        }
        return waitTime - 1
      });
    }, 1000)
  }

  return (
    <div className="containerMain">
      <div className="sideFeature mainSide">
        <div className={styles.introTitle}>Tạo tài khoản dễ dàng</div>
        <div className={styles.titleMethod}><hr />Đăng kí bằng email<hr /></div>
        <div className={styles.login}>
          <Formik
            initialValues={{
              email: '',
              code: '',
              password: '',
            }}
            onSubmit={signUpLocalCallback}
            validate={validate}
          >
            {() => (
              <Form id="form-login" action="sign-up" method="POST" className={styles.loginForm}>
                <div className={styles.loginForm_Text}>
                  <EmailIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                  <Field
                    className={styles.inputField}
                    name="email"
                    type="text"
                    placeholder="Tài khoản email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value.trim())}
                  />
                  <ErrorMessage name="email" render={msg => <div className="txtErrorInput">{msg}</div>} />
                </div>
                <div className={styles.loginForm_Text}>
                  <div className={styles.notifyInput}></div>
                  <AddModeratorIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                  <i className="fas fa-shield-alt font-icon"></i>
                  <span className={styles.btnSendCode} style={{ display: isValidEmail ? "inline" : "none" }}
                    onClick={handRequestGetCode}
                  >
                    Nhận mã
                  </span>
                  <div className={styles.ctnFunction}>
                    {waitTime > 0 ? waitTime : (isRequestCodeLoading ? <LoadingIcons.TailSpin stroke="#ff6541" style={{ width: 23, height: 23 }} /> : null)}
                  </div>
                  <Field className={styles.inputField} name="code" type="number" step="1" placeholder="Mã xác thực" />
                  <ErrorMessage name="code" render={msg => <div className="txtErrorInput">{msg}</div>} />
                </div>
                <div className={styles.loginForm_Text}>
                  <div className={styles.notifyInput}></div>
                  <LockIcon className={styles.fontIcon} style={{ fontSize: '2.2rem' }} />
                  <Field className={styles.inputField} name="password" type="password" placeholder="Mật khẩu" />
                  <ErrorMessage name="password" render={msg => <div className="txtErrorInput">{msg}</div>} />
                </div>

                <div className={styles.loginForm_Submit}>
                  <button type="submit" disabled={isRequestSignUpLoading}>
                    {isRequestSignUpLoading ? <LoadingIcons.TailSpin style={{ width: 30 }} /> : "Đăng kí"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

        </div>
        <div className={styles.loginFoot}>
          Đã có tài khoản, vui lòng <Link to="/sign-in">đăng nhập</Link>
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
