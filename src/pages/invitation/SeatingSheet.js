import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import { IoPrintOutline, IoArrowBack } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { eventHeadline, invitationApi } from 'util/invitation';
import { tableLabel } from 'util/seating';
import { byName, byTable } from 'util/seatingSheet';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './SeatingSheet.module.scss';

const VIEWS = [
  ['name', 'Theo tên', 'Đặt ở lối vào: khách tìm tên mình để biết bàn.'],
  ['table', 'Theo bàn', 'Cho nhà hàng và MC: mỗi bàn những ai, bao nhiêu người.'],
];

/**
 * The seating plan on paper (A4, black on white whatever the theme): a
 * board by name for the entrance, or a list by table for the venue.
 */
export default function SeatingSheet() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState('name');

  useEffect(() => {
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Tra cứu bàn · ${eventHeadline(invitation)}` });
        setEvent(invitation);
      })
      .catch(() => setFailed(true));
  }, [eventId]);

  const guests = useMemo(() => event?.guests ?? [], [event]);
  const names = useMemo(() => byName(guests), [guests]);
  const tables = useMemo(() => byTable(guests), [guests]);

  if (failed) {
    return (
      <div className={styles.message}>
        <p>Không mở được danh sách. Hãy đăng nhập bằng tài khoản đã tạo thiệp rồi thử lại.</p>
        <Button component={Link} to="/sign-in" variant="contained">Đăng nhập</Button>
      </div>
    );
  }
  if (!event) {
    return <OvalLoading />;
  }

  const when = dayjs(vnWallClock(event.startAt)).format('HH:mm · DD/MM/YYYY');
  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button component={Link} to={`/events/${eventId}/xep-ban`} startIcon={<IoArrowBack />}>Xếp bàn</Button>
        <div className={styles.views} role="tablist" aria-label="Kiểu bảng">
          {VIEWS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              className={clsx(view === key && styles.on)}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          variant="contained"
          startIcon={<IoPrintOutline />}
          onClick={() => {
            track('seating_printed', { view });
            window.print();
          }}
        >
          In
        </Button>
        <p className={styles.tip}>{VIEWS.find(([key]) => key === view)[2]} Chọn khổ A4 khi in.</p>
      </div>

      <article className={styles.sheet}>
        <header>
          <p className={styles.kicker}>{view === 'name' ? 'Tra cứu bàn' : 'Sơ đồ bàn'}</p>
          <h1>{eventHeadline(event)}</h1>
          <p className={styles.meta}>{when} · {event.location}</p>
        </header>

        {tables.length === 0 ? (
          <p className={styles.empty}>Chưa xếp bàn cho khách nào.</p>
        ) : view === 'name' ? (
          <div className={styles.columns}>
            {names.map(section => (
              <section key={section.letter} className={styles.letter}>
                <h2>{section.letter}</h2>
                <ul>
                  {section.rows.map(row => (
                    <li key={row.id}>
                      <span className={styles.name}>{row.name}</span>
                      <span className={styles.dots} aria-hidden />
                      <strong>{tableLabel(row.table)}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className={styles.tables}>
            {tables.map(t => (
              <section key={t.table} className={styles.table}>
                <h2>
                  {tableLabel(t.table)}
                  <span>{t.people} người</span>
                </h2>
                <ol>
                  {t.guests.map(g => (
                    <li key={g.id}>
                      {g.name}
                      {g.people > 1 && <span> · {g.people} người</span>}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
