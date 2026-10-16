import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import dayjs from 'dayjs';
import { IoPrintOutline, IoArrowBack } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { eventHeadline, invitationApi, isCoupleEvent } from 'util/invitation';
import { BOOK_ACCENTS, bookCount, bookWishes } from 'util/guestbook';
import { cldUrl } from 'util/photos';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './GuestbookSheet.module.scss';

/**
 * The guestbook to print or save as a PDF after the party: a cover with
 * the couple, then every wish in the order they came. Paper colors in any
 * theme, the invitation's accent as ink.
 */
export default function GuestbookSheet() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [failed, setFailed] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(false);

  useEffect(() => {
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Sổ lưu bút · ${eventHeadline(invitation)}` });
        setEvent(invitation);
      })
      .catch(() => setFailed(true));
  }, [eventId]);

  const wishes = useMemo(() => bookWishes(event?.wishes, { includeHidden }), [event, includeHidden]);
  const hiddenCount = useMemo(() => (event?.wishes ?? []).filter(w => w.isHidden).length, [event]);

  if (failed) {
    return (
      <div className={styles.message}>
        <p>Không mở được sổ lưu bút. Hãy đăng nhập bằng tài khoản đã tạo thiệp rồi thử lại.</p>
        <Button component={Link} to="/sign-in" variant="contained">Đăng nhập</Button>
      </div>
    );
  }
  if (!event) {
    return <OvalLoading />;
  }

  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  const shownAt = vnWallClock(event.startAt);
  const cover = event.photos?.[0];
  return (
    <div className={styles.page} style={{ '--book-accent': BOOK_ACCENTS[event.theme] ?? BOOK_ACCENTS.classic }}>
      <div className={styles.toolbar}>
        <Button component={Link} to={`/events/${eventId}`} startIcon={<IoArrowBack />}>Quay lại</Button>
        {hiddenCount > 0 && (
          <FormControlLabel
            className={styles.toggle}
            control={<Switch checked={includeHidden} onChange={e => setIncludeHidden(e.target.checked)} />}
            label={`Gồm ${hiddenCount} lời chúc đã ẩn`}
          />
        )}
        <Button
          variant="contained"
          startIcon={<IoPrintOutline />}
          disabled={wishes.length === 0}
          onClick={() => {
            track('guestbook_printed', { wishes: wishes.length });
            window.print();
          }}
        >
          In / lưu PDF
        </Button>
        <p className={styles.tip}>Chọn khổ A4. Muốn giữ file thì chọn “Lưu dưới dạng PDF” ở mục máy in.</p>
      </div>

      <article className={styles.book}>
        <section className={styles.cover}>
          <p className={styles.kicker}>Sổ lưu bút</p>
          {cover ? (
            <img className={styles.photo} src={cldUrl(cover.url, 'w_800,h_1000,c_fill,g_faces')} alt="" />
          ) : (
            <div className={styles.seal} aria-hidden>{couple ? '囍' : '✦'}</div>
          )}
          {couple ? (
            <h1 className={styles.names}>
              {event.groomName}
              <span>&amp;</span>
              {event.brideName}
            </h1>
          ) : (
            <h1 className={styles.names}>{event.title}</h1>
          )}
          <p className={styles.when}>{dayjs(shownAt).format('DD · MM · YYYY')}</p>
          <p className={styles.where}>{event.location}</p>
          <p className={styles.count}>{bookCount(wishes.length)}</p>
        </section>

        {wishes.length > 0 && (
          <section className={styles.wishes} aria-label="Lời chúc">
            {wishes.map(w => (
              <figure key={w._id} className={styles.wish}>
                <blockquote>{w.message}</blockquote>
                <figcaption>
                  <strong>{w.name}</strong>
                  <span>{dayjs(vnWallClock(w.createdAt)).format('DD/MM/YYYY')}</span>
                </figcaption>
              </figure>
            ))}
          </section>
        )}

        <footer className={styles.end}>
          <span aria-hidden>{couple ? '囍' : '✦'}</span>
          <p>{couple ? 'Cảm ơn mọi người đã chung vui cùng chúng mình.' : 'Cảm ơn mọi người đã đến chung vui.'}</p>
        </footer>
      </article>
    </div>
  );
}
