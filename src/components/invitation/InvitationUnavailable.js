import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import styles from './InvitationLoading.module.scss';

/**
 * In place of an invitation that cannot be shown: the link no longer works
 * (`missing`) or it could not be loaded (`offline`, with a retry).
 */
export default function InvitationUnavailable({ reason, isPublic, onRetry }) {
  const offline = reason === 'offline';
  let title = 'Không mở được thiệp';
  let text = 'Kiểm tra kết nối mạng rồi thử lại nhé.';
  if (!offline) {
    title = isPublic ? 'Link chung không còn mở' : 'Thiệp mời không còn hiệu lực';
    text = isPublic
      ? 'Gia chủ đã tắt link chung của thiệp này. Bạn nhắn người gửi để xin link mới nhé.'
      : 'Có thể gia chủ đã cập nhật danh sách khách. Bạn nhắn người gửi để xin link mới nhé.';
  }
  return (
    <div className={styles.wrap} role="alert">
      <span className={styles.seal} data-still>{offline ? '…' : '囍'}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{text}</p>
      <div className={styles.actions}>
        {offline && <Button variant="contained" onClick={onRetry}>Thử lại</Button>}
        <Button component={Link} to="/cuoi-hoi">Về FollMe</Button>
      </div>
    </div>
  );
}
