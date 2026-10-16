import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { cardText, urlCardLang } from 'util/cardText';
import styles from './InvitationLoading.module.scss';

/**
 * In place of an invitation that cannot be shown: the link no longer works
 * (`missing`) or it could not be loaded (`offline`, with a retry).
 */
export default function InvitationUnavailable({ reason, isPublic, onRetry }) {
  const offline = reason === 'offline';
  const t = cardText(urlCardLang()).unavailable;
  let title = t.offlineTitle;
  let text = t.offlineText;
  if (!offline) {
    title = isPublic ? t.publicTitle : t.missingTitle;
    text = isPublic ? t.publicText : t.missingText;
  }
  return (
    <div className={styles.wrap} role="alert">
      <span className={styles.seal} data-still>{offline ? '…' : '囍'}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{text}</p>
      <div className={styles.actions}>
        {offline && <Button variant="contained" onClick={onRetry}>{t.retry}</Button>}
        <Button component={Link} to="/cuoi-hoi">{t.home}</Button>
      </div>
    </div>
  );
}
