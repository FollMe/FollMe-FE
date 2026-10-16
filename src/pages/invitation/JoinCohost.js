import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { IoPeopleCircleOutline, IoCheckmarkCircle } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { useUserInfo } from 'customHooks/useUserInfo';
import { handleCheckLoggedIn } from 'util/authHelper';
import { MAX_COHOSTS, invitationApi } from 'util/invitation';
import { vnWallClock } from 'util/date';
import { track } from 'util/analytics';
import styles from './JoinCohost.module.scss';

const CAN_DO = [
  'Sửa thiệp, thêm khách và gửi link mời',
  'Xem ai sẽ đến, đọc lời chúc',
  'Xếp bàn, đón khách, ghi sổ mừng và thu chi',
];

/**
 * The host's link to manage the event with them (/cung-quan-ly/:id/:key):
 * who invites you to what, then sign in and accept.
 */
export default function JoinCohost() {
  const navigate = useNavigate();
  const { eventId, key } = useParams();
  const [userInfo] = useUserInfo();
  const isLoggedIn = handleCheckLoggedIn(userInfo.sessionExp);
  const [invite, setInvite] = useState(undefined);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    document.title = 'Cùng quản lý thiệp | FollMe';
    invitationApi.cohostInvite(eventId, key).then(setInvite).catch(() => setInvite(null));
  }, [eventId, key]);

  function signIn(to) {
    window.sessionStorage.setItem('redirect', window.location.pathname);
    navigate(to);
  }

  async function accept() {
    setIsJoining(true);
    try {
      await invitationApi.joinCohost(eventId, key);
      track('cohost_joined');
      toast.success(`Bạn đã cùng quản lý thiệp "${invite.title}"`);
      navigate(`/events/${eventId}`, { replace: true });
    } catch (err) {
      setIsJoining(false);
    }
  }

  if (invite === undefined) {
    return <OvalLoading />;
  }

  if (!invite) {
    return (
      <div className={`container page ${styles.page}`}>
        <section className={styles.card}>
          <h1>Link không còn dùng được</h1>
          <p className={styles.lead}>
            Có thể chủ thiệp đã đổi link hoặc đã xoá thiệp. Nhờ họ gửi lại link mới trong phần "Cùng quản lý" của thiệp.
          </p>
          <Button component={Link} to="/" variant="outlined">Về trang chủ</Button>
        </section>
      </div>
    );
  }

  const me = String(userInfo._id ?? '');
  const already = isLoggedIn && (invite.hostId === me || invite.cohosts.includes(me));
  const when = dayjs(vnWallClock(invite.startAt)).format('HH:mm · DD/MM/YYYY');

  return (
    <div className={`container page ${styles.page}`}>
      <section className={styles.card} aria-labelledby="cohost-title">
        <div className={styles.icon} aria-hidden><IoPeopleCircleOutline /></div>
        <p className={styles.eyebrow}>Lời mời cùng quản lý</p>
        <h1 id="cohost-title">{invite.hostName || 'Chủ thiệp'} mời bạn cùng quản lý thiệp</h1>
        <p className={styles.event}>
          <strong>{invite.title}</strong>
          <span>{when}</span>
        </p>
        <ul className={styles.canDo}>
          {CAN_DO.map(item => <li key={item}><IoCheckmarkCircle aria-hidden /> {item}</li>)}
        </ul>
        <p className={styles.note}>Chỉ chủ thiệp xoá được thiệp. Bạn rời khỏi lúc nào cũng được.</p>

        {already ? (
          <Button component={Link} to={`/events/${eventId}`} variant="contained" size="large">
            Bạn đã quản lý thiệp này · Mở thiệp
          </Button>
        ) : invite.full ? (
          <p className={styles.full} role="status">
            Thiệp đã đủ {MAX_COHOSTS} người cùng quản lý. Nhờ {invite.hostName || 'chủ thiệp'} bỏ bớt một người rồi mở lại link.
          </p>
        ) : isLoggedIn ? (
          <LoadingButton variant="contained" size="large" loading={isJoining} onClick={accept}>
            Nhận lời, cùng quản lý
          </LoadingButton>
        ) : (
          <div className={styles.actions}>
            <Button variant="contained" size="large" onClick={() => signIn('/sign-in')}>Đăng nhập để nhận lời</Button>
            <Button onClick={() => signIn('/sign-up')}>Chưa có tài khoản? Đăng ký</Button>
          </div>
        )}
      </section>
    </div>
  );
}
