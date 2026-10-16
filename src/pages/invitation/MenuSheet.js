import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { IoPrintOutline, IoArrowBack } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { eventHeadline, invitationApi, isCoupleEvent } from 'util/invitation';
import { DEFAULT_SEATS, seatingPlan } from 'util/seating';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import sheet from './SeatingSheet.module.scss';
import styles from './MenuSheet.module.scss';

const MAX_COPIES = 80;

/**
 * Menu cards for the tables: A4 landscape, two standing A5 cards a page
 * to cut in half, in the invitation's colors.
 */
export default function MenuSheet() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [failed, setFailed] = useState(false);
  const [copies, setCopies] = useState('');

  useEffect(() => {
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Thực đơn · ${eventHeadline(invitation)}` });
        setEvent(invitation);
        // A card per table when there is a seating plan
        const tables = seatingPlan(invitation.guests ?? [], invitation.seatsPerTable ?? DEFAULT_SEATS).tables.length;
        setCopies(String(tables > 0 ? tables + (tables % 2) : 10));
      })
      .catch(() => setFailed(true));
  }, [eventId]);

  const count = Math.min(Math.max(Number(copies) || 0, 1), MAX_COPIES);
  const pages = useMemo(() => Array.from({ length: Math.ceil(count / 2) }, (_, i) => Math.min(2, count - i * 2)), [count]);

  if (failed) {
    return (
      <div className={sheet.message}>
        <p>Không mở được thực đơn. Hãy đăng nhập bằng tài khoản đã tạo thiệp rồi thử lại.</p>
        <Button component={Link} to="/sign-in" variant="contained">Đăng nhập</Button>
      </div>
    );
  }
  if (!event) {
    return <OvalLoading />;
  }

  const menu = event.menu ?? [];
  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  const day = dayjs(vnWallClock(event.startAt)).format('DD . MM . YYYY');
  const card = (
    <div className={styles.card}>
      <p className={styles.kicker}>Thực đơn</p>
      {couple ? (
        <h2 className={styles.couple}>{event.groomName}<span>&amp;</span>{event.brideName}</h2>
      ) : (
        <h2 className={styles.title}>{event.title}</h2>
      )}
      <p className={styles.day}>{day}</p>
      <span className={styles.ornament} aria-hidden>{couple ? '囍' : '✦'}</span>
      <ol className={styles.dishes}>
        {menu.map((dish, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={`${dish}-${i}`}>{dish}</li>
        ))}
      </ol>
      <span className={styles.ornament} aria-hidden>✦</span>
      <p className={styles.wish}>Chúc quý khách ngon miệng</p>
    </div>
  );

  return (
    <div className={clsx(sheet.page, styles.page, styles[event.theme || 'minimal'])}>
      <div className={sheet.toolbar}>
        <Button component={Link} to={`/events/${eventId}`} startIcon={<IoArrowBack />} sx={{ mr: 'auto' }}>Quản lý thiệp</Button>
        <TextField
          size="small"
          label="Số thẻ"
          value={copies}
          onChange={e => setCopies(e.target.value.replace(/\D/g, '').slice(0, 2))}
          inputProps={{ inputMode: 'numeric' }}
          sx={{ width: 100 }}
          helperText={`${pages.length} trang`}
        />
        <Button
          variant="contained"
          startIcon={<IoPrintOutline />}
          disabled={!menu.length}
          onClick={() => {
            track('menu_printed', { copies: count });
            window.print();
          }}
        >
          In
        </Button>
        <p className={sheet.tip}>Khổ A4 nằm ngang, mỗi trang hai thẻ A5, cắt đôi rồi gấp hoặc dựng lên bàn. Mặc định một thẻ mỗi bàn.</p>
      </div>
      {menu.length === 0 ? (
        <article className={sheet.sheet}>
          <p className={sheet.empty}>
            Thiệp chưa có thực đơn. <Link to={`/events/${eventId}/edit#thuc-don`}>Thêm ở trang sửa thiệp</Link>.
          </p>
        </article>
      ) : (
        pages.map((n, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <article key={i} className={styles.sheet} aria-label={`Trang ${i + 1}`}>
            {card}
            {n === 2 ? card : <div className={styles.card} aria-hidden />}
          </article>
        ))
      )}
    </div>
  );
}
