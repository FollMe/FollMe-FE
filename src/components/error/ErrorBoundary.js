import { Component } from 'react';
import { isChunkLoadError, reportError } from 'util/errorReporter';
import styles from './ErrorBoundary.module.scss';

const RELOAD_KEY = 'follme.reloadedAt';

/**
 * After a deploy, an open tab asks for page code that no longer exists:
 * reload once to get the new version. Not again within a minute, so a
 * real outage shows the message instead of a reload loop.
 */
function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 60 * 1000) {
      return false;
    }
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch (err) {
    return false;
  }
  window.location.reload();
  return true;
}

/** A friendly page instead of a blank one when rendering fails. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error) && reloadForNewVersion()) {
      this.setState({ reloading: true });
      return;
    }
    reportError(error);
  }

  render() {
    const { error, reloading } = this.state;
    if (!error) {
      return this.props.children;
    }
    if (reloading) {
      return null;
    }
    return (
      <div className={styles.page} role="alert">
        <span className={styles.seal} aria-hidden>!</span>
        <h1>Có lỗi xảy ra</h1>
        <p>
          {isChunkLoadError(error)
            ? 'Không tải được trang, có thể mạng đang chập chờn. Tải lại thường sẽ ổn.'
            : 'Trang gặp sự cố khi hiển thị. Đội FollMe đã nhận được báo lỗi; bạn thử tải lại nhé.'}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
          <a href="/">Về trang chủ</a>
        </div>
      </div>
    );
  }
}
