import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import { IoPrintOutline, IoArrowBack } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { eventHeadline, invitationApi } from 'util/invitation';
import { shuttleRiders, shuttleWhen } from 'util/shuttles';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import sheet from './SeatingSheet.module.scss';
import styles from './ShuttleSheet.module.scss';

/**
 * Who rides each bus, on paper (A4, a page per bus): for whoever rides
 * along to tick names as guests get on.
 */
export default function ShuttleSheet() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Danh sách xe · ${eventHeadline(invitation)}` });
        setEvent(invitation);
      })
      .catch(() => setFailed(true));
  }, [eventId]);

  const buses = useMemo(() => (event ? shuttleRiders(event, event.guests ?? []) : []), [event]);

  if (failed) {
    return (
      <div className={sheet.message}>
        <p>Không mở được danh sách. Hãy đăng nhập bằng tài khoản đã tạo thiệp rồi thử lại.</p>
        <Button component={Link} to="/sign-in" variant="contained">Đăng nhập</Button>
      </div>
    );
  }
  if (!event) {
    return <OvalLoading />;
  }

  const day = dayjs(vnWallClock(event.startAt)).format('DD/MM/YYYY');
  return (
    <div className={sheet.page}>
      <div className={sheet.toolbar}>
        <Button component={Link} to={`/events/${eventId}#xe-dua-don`} startIcon={<IoArrowBack />} sx={{ mr: 'auto' }}>Quản lý thiệp</Button>
        <Button
          variant="contained"
          startIcon={<IoPrintOutline />}
          disabled={!buses.length}
          onClick={() => {
            track('shuttles_printed', { buses: buses.length });
            window.print();
          }}
        >
          In
        </Button>
        <p className={sheet.tip}>Mỗi xe một trang, có ô đánh dấu khách đã lên xe. Chọn khổ A4 khi in.</p>
      </div>

      {buses.length === 0 && (
        <article className={sheet.sheet}>
          <p className={sheet.empty}>Thiệp chưa có xe đưa đón. Thêm chuyến xe ở trang sửa thiệp.</p>
        </article>
      )}
      {buses.map(bus => (
        <article key={bus._id} className={`${sheet.sheet} ${styles.bus}`}>
          <header>
            <p className={sheet.kicker}>Danh sách xe · {eventHeadline(event)} · {day}</p>
            <h1>{bus.label}</h1>
            <p className={sheet.meta}>
              Xuất phát {shuttleWhen(bus)} · {bus.taken}/{bus.seats} chỗ đã đăng ký
            </p>
          </header>
          {bus.riders.length === 0 ? (
            <p className={sheet.empty}>Chưa có khách chọn xe này.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Khách</th>
                  <th scope="col">Nhóm</th>
                  <th scope="col">Số người</th>
                  <th scope="col">Đã lên xe</th>
                </tr>
              </thead>
              <tbody>
                {bus.riders.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.group ?? ''}</td>
                    <td>{r.people}</td>
                    <td><span className={styles.box} aria-hidden /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className={styles.foot}>{event.location}</p>
        </article>
      ))}
    </div>
  );
}
