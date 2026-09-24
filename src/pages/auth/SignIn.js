import clsx from "clsx";
import { useState, useEffect } from "react"
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import { toast } from 'react-toastify';
import CircularProgress from '@mui/material/CircularProgress';
import { IoMailOutline, IoLockClosedOutline } from 'react-icons/io5';
import AuthShell from "components/auth/AuthShell";
import styles from './SignIn.module.scss';

import { useUserInfo } from "customHooks/useUserInfo";
import { useColorMode } from "customHooks/useColorMode";
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

export function renderGoogleButton(mode) {
  const element = document.getElementById("login-google-button");
  if (!element || !window.google?.accounts?.id) {
    return;
  }
  element.innerHTML = '';
  window.google.accounts.id.renderButton(element, {
    type: "standard",
    theme: mode === 'dark' ? "filled_black" : "outline",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: Math.min(element.offsetWidth || 400, 400),
  });
}

export default function SignIn() {
  const navigate = useNavigate();
  const [mode] = useColorMode();
  const [userInfo, setUserInfo] = useUserInfo();
  const [isOauthGoogleLoading, setIsOauthGoogleLoading] = useState(false);
  const [isAuthLocalLoading, setIsAuthLocalLoading] = useState(false);

  useEffect(() => {
    document.title = "Đăng nhập | FollMe";
    const isLoggedIn = handleCheckLoggedIn(userInfo.sessionExp)

    if (isLoggedIn) {
      return navigate('/');
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: oauthGoogleCallback,
      })
      window.google.accounts.id.prompt();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <AuthShell
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để bình luận, viết blog và quản lý thư mời của bạn."
      footer={<>Chưa có tài khoản? <Link to="/sign-up">Đăng kí ngay</Link></>}
    >
      <div className={styles.oauth}>
        <div id="login-google-button" className={styles.googleButton}
          style={{ display: isOauthGoogleLoading ? "none" : "flex" }}
        />
        {isOauthGoogleLoading && (
          <div className={styles.oauthLoading}><CircularProgress size={22} /> Đang đăng nhập với Google…</div>
        )}
      </div>

      <div className={styles.divider}><span>hoặc dùng email</span></div>

      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        onSubmit={authLocalCallback}
        validate={validate}
      >
        {({ errors, touched }) => (
          <Form id="login-form" method="post" className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <div className={clsx(styles.inputWrap, touched.email && errors.email && styles.invalid)}>
                <IoMailOutline className={styles.inputIcon} />
                <Field id="email" name="email" className={styles.input} type="email" autoComplete="email" placeholder="ban@example.com" />
              </div>
              <ErrorMessage name="email" render={msg => <div className="txtErrorInput">{msg}</div>} />
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                <span className={styles.forgot}>Quên mật khẩu?</span>
              </div>
              <div className={clsx(styles.inputWrap, touched.password && errors.password && styles.invalid)}>
                <IoLockClosedOutline className={styles.inputIcon} />
                <Field id="password" className={styles.input} name="password" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" />
              </div>
              <ErrorMessage name="password" render={msg => <div className="txtErrorInput">{msg}</div>} />
            </div>
            <label className={styles.checkbox}>
              <Field type="checkbox" name="isRemember" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button type="submit" className={styles.submit} disabled={isAuthLocalLoading}>
              {isAuthLocalLoading ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : "Đăng nhập"}
            </button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}
