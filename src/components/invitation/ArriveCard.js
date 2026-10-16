import { useState } from 'react';
import dayjs from 'dayjs';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { invitationApi } from 'util/invitation';
import { tableLabel } from 'util/seating';
import { vnWallClock } from 'util/date';
import { burst } from 'util/confetti';
import { track } from 'util/analytics';
import styles from './ArriveCard.module.scss';

// From a little before the party to its end (the server checks too)
const OPENS_BEFORE_MS = 3 * 60 * 60 * 1000;
const CLOSES_AFTER_MS = 8 * 60 * 60 * 1000;

/** Whether guests can check themselves in now. */
export function selfCheckInOpen(startAt, now = Date.now()) {
  const start = new Date(startAt).getTime();
  return now >= start - OPENS_BEFORE_MS && now <= start + CLOSES_AFTER_MS;
}

/**
 * "Mình đã đến": at the door, a guest taps on their own card instead of
 * queueing at the desk; the desk and the hosts see it, and the card says
 * where to sit.
 */
export default function ArriveCard({ guest, onGuestChange }) {
  const [arrival, setArrival] = useState(guest.arrivedAt ? { arrivedAt: guest.arrivedAt, table: guest.table } : null);
  const [isSending, setIsSending] = useState(false);
  const name = guest.name || 'bạn';

  async function arrive() {
    setIsSending(true);
    try {
      const res = await invitationApi.arrive(guest._id, {});
      setArrival(res);
      onGuestChange?.({ ...guest, arrivedAt: res.arrivedAt, arrivedCount: res.arrivedCount, table: res.table ?? guest.table });
      burst();
      track('self_checkin', { table: Boolean(res.table) });
    } catch (err) {
      // The request said what went wrong
    } finally {
      setIsSending(false);
    }
  }

  if (arrival) {
    return (
      <div className={styles.card} role="status">
        <IoCheckmarkCircle className={styles.icon} aria-hidden />
        <p className={styles.title}>Chào mừng {name}!</p>
        <p className={styles.text}>
          {arrival.table
            ? <>Mời {name} ngồi <strong>{tableLabel(arrival.table)}</strong>.</>
            : 'Người đón khách sẽ đưa bạn vào chỗ nhé.'}
        </p>
        <p className={styles.small}>Đã báo đến lúc {dayjs(vnWallClock(arrival.arrivedAt)).format('HH:mm')}</p>
      </div>
    );
  }
  return (
    <div className={styles.card}>
      <p className={styles.title}>Bạn đã tới nơi?</p>
      <p className={styles.text}>Bấm để báo cô dâu chú rể và người đón khách, không cần xếp hàng ở bàn tiếp tân.</p>
      <button type="button" className={styles.button} onClick={arrive} disabled={isSending}>
        {isSending ? 'Đang báo…' : 'Mình đã đến'}
      </button>
    </div>
  );
}
