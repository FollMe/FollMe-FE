import clsx from "clsx";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Field, ErrorMessage, Form } from 'formik';
import CircularProgress from '@mui/material/CircularProgress';
import { IoMailOutline, IoLockClosedOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { request, authRouteList } from "util/request";
import AuthShell from "components/auth/AuthShell";
import { useUserInfo } from "customHooks/useUserInfo";
import { useColorMode } from "customHooks/useColorMode";
import { handleCheckLoggedIn } from "util/authHelper";
import { renderGoogleButton } from "./SignIn";

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
  const [mode] = useColorMode();
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

    // Init Google Oauth
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: oauthGoogleCallback,
      })
      window.google.accounts.id.prompt();
    }
  }, [])

  useEffect(() => {
    renderGoogleButton(mode);
  }, [mode])

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
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Chỉ mất một phút — nhập email, nhận mã xác thực và đặt mật khẩu."
      footer={<>Đã có tài khoản? <Link to="/sign-in">Đăng nhập</Link></>}
    >
      <div className={styles.oauth}>
        <div id="login-google-button" className={styles.googleButton}
          style={{ display: isOauthGoogleLoading ? "none" : "flex" }}
        />
        {isOauthGoogleLoading && (
          <div className={styles.oauthLoading}><CircularProgress size={22} /> Đang đăng nhập với Google…</div>
        )}
      </div>

      <div className={styles.divider}><span>hoặc đăng kí bằng email</span></div>

      <Formik
        initialValues={{
          email: '',
          code: '',
          password: '',
        }}
        onSubmit={signUpLocalCallback}
        validate={validate}
      >
        {({ errors, touched }) => (
          <Form id="form-login" action="sign-up" method="POST" className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <div className={styles.inputWrap}>
                <IoMailOutline className={styles.inputIcon} />
                <Field
                  id="email"
                  className={styles.input}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ban@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value.trim())}
                />
              </div>
              <ErrorMessage name="email" render={msg => <div className="txtErrorInput">{msg}</div>} />
            </div>
            <div className={styles.field}>
              <label htmlFor="code" className={styles.label}>Mã xác thực</label>
              <div className={clsx(styles.inputWrap, touched.code && errors.code && styles.invalid)}>
                <IoShieldCheckmarkOutline className={styles.inputIcon} />
                <Field id="code" className={styles.input} style={{ paddingRight: 130 }} name="code" type="number" step="1" placeholder="Nhập mã gửi tới email" />
                <button
                  type="button"
                  className={styles.inputAction}
                  onClick={handRequestGetCode}
                  disabled={!isValidEmail || waitTime > 0 || isRequestCodeLoading}
                >
                  {isRequestCodeLoading
                    ? <CircularProgress size={14} sx={{ color: 'inherit' }} />
                    : waitTime > 0 ? `Gửi lại (${waitTime}s)` : 'Nhận mã'}
                </button>
              </div>
              <ErrorMessage name="code" render={msg => <div className="txtErrorInput">{msg}</div>} />
            </div>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Mật khẩu</label>
              <div className={clsx(styles.inputWrap, touched.password && errors.password && styles.invalid)}>
                <IoLockClosedOutline className={styles.inputIcon} />
                <Field id="password" className={styles.input} name="password" type="password" autoComplete="new-password" placeholder="Ít nhất 6 kí tự" />
              </div>
              <ErrorMessage name="password" render={msg => <div className="txtErrorInput">{msg}</div>} />
            </div>

            <button type="submit" className={styles.submit} disabled={isRequestSignUpLoading}>
              {isRequestSignUpLoading ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : "Đăng kí"}
            </button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}
