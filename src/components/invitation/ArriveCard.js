import { useState } from 'react';
import QRCode from 'react-qr-code';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { invitationApi, personalInvitationUrl } from 'util/invitation';
import { vnWallClock } from 'util/date';
import { burst } from 'util/confetti';
import { track } from 'util/analytics';
import { useCardText } from './CardLang';
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
  // Their own QR, for the desk to scan instead
  const [showCode, setShowCode] = useState(false);
  const card = useCardText();
  const t = card.arrive;
  const name = guest.name || '';

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
        <p className={styles.title}>{t.welcome(name)}</p>
        <p className={styles.text}>
          {arrival.table
            ? <>{t.seatLead(name)}<strong>{card.table(arrival.table)}</strong>.</>
            : t.noTable}
        </p>
        <p className={styles.small}>{t.at(t.time(vnWallClock(arrival.arrivedAt)))}</p>
      </div>
    );
  }
  return (
    <div className={styles.card}>
      <p className={styles.title}>{t.title}</p>
      <p className={styles.text}>{t.text}</p>
      <button type="button" className={styles.button} onClick={arrive} disabled={isSending}>
        {isSending ? t.sending : t.button}
      </button>
      <button type="button" className={styles.codeToggle} aria-expanded={showCode} onClick={() => setShowCode(v => !v)}>
        {showCode ? t.hideCode : t.showCode}
      </button>
      {showCode && (
        <figure className={styles.code}>
          <QRCode value={personalInvitationUrl(guest._id)} size={184} level="M" bgColor="#ffffff" fgColor="#1c1917" title={t.codeLabel(guest.name)} />
          <figcaption>{t.codeHint}</figcaption>
        </figure>
      )}
    </div>
  );
}
