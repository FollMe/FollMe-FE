import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { IoLocationOutline, IoNavigateOutline, IoQrCodeOutline, IoHeart, IoSend, IoCheckmarkCircle } from 'react-icons/io5';
import QRModel from 'pages/invitation/QRModel';
import { getAlmanac, lunarMonthLabel } from 'util/fortune';
import { RSVP_LABELS, invitationApi, isCoupleEvent, savePublicGuest } from 'util/invitation';
import { track } from 'util/analytics';
import styles from './InvitationView.module.scss';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const INTRO = {
  wedding: 'tới dự lễ thành hôn của',
  engagement: 'tới dự lễ ăn hỏi của',
};

function useCountdown(startAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const distance = startAt.getTime() - now;
  if (distance <= 0) {
    return null;
  }
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };
}

function mapsUrl(event) {
  if (event.mapLocation && /^https?:\/\//.test(event.mapLocation)) {
    return event.mapLocation;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
}

/**
 * The invitation a guest opens. `guest` is set on a personal link
 * (/invitations/:id); on the public link (/e/:eventId) it is the guest this
 * browser answered as, if any.
 */
export default function InvitationView({ event, guest, wishes: initialWishes = [], isPublic, onGuestChange }) {
  const startAt = useMemo(() => new Date(event.startAt), [event.startAt]);
  const countdown = useCountdown(startAt);
  const [lunar, setLunar] = useState(null);
  const [wishes, setWishes] = useState(initialWishes);
  const [showQR, setShowQR] = useState(false);
  const theme = event.theme || 'minimal';
  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  const endAt = new Date(startAt.getTime() + 3 * 60 * 60 * 1000);

  useEffect(() => {
    getAlmanac(dayjs(startAt).format('YYYY-MM-DD'))
      .then(setLunar)
      .catch(() => setLunar(null));
  }, [startAt]);

  return (
    <div className={clsx(styles.page, styles[theme])}>
      <div className={styles.paper}>
        <header className={styles.hero}>
          <p className={styles.invite}>
            Trân trọng kính mời{' '}
            <strong>{guest?.name && !isPublic ? guest.name : 'bạn'}</strong>
            <br />
            {INTRO[event.type] ?? 'tới dự'}
          </p>
          {couple ? (
            <h1 className={styles.couple}>
              <span>{event.groomName}</span>
              <span className={styles.amp}>&amp;</span>
              <span>{event.brideName}</span>
            </h1>
          ) : (
            <h1 className={styles.title}>{event.title}</h1>
          )}
          <div className={styles.ornament} aria-hidden>
            <span />{couple ? '囍' : '✦'}<span />
          </div>
        </header>

        <section className={styles.when}>
          <div className={styles.dateRow}>
            <span className={styles.dateSide}>{WEEKDAYS[startAt.getDay()]}</span>
            <span className={styles.dateBig}>{startAt.getDate()}</span>
            <span className={styles.dateSide}>Tháng {startAt.getMonth() + 1}<br />{startAt.getFullYear()}</span>
          </div>
          <div className={styles.time}>{dayjs(startAt).format('HH:mm')}</div>
          {lunar && (
            <p className={styles.lunar}>
              Tức ngày {lunar.lunar.day} {lunarMonthLabel(lunar.lunar)} năm {lunar.yearName}
            </p>
          )}
          {countdown ? (
            <div className={styles.countdown} aria-label="Đếm ngược">
              {[['days', 'Ngày'], ['hours', 'Giờ'], ['minutes', 'Phút'], ['seconds', 'Giây']].map(([key, label]) => (
                <div key={key}>
                  <strong>{countdown[key]}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.over}>Sự kiện đã diễn ra. Cảm ơn bạn đã ghé thăm!</p>
          )}
        </section>

        <section className={styles.where}>
          <IoLocationOutline className={styles.whereIcon} />
          <p>{event.location}</p>
          <div className={styles.whereActions}>
            <Button href={mapsUrl(event)} target="_blank" rel="noreferrer" variant="outlined" size="small" startIcon={<IoNavigateOutline />}>
              Chỉ đường
            </Button>
            <AddToCalendarButton
              label="Lưu vào lịch"
              name={event.title}
              options={['Google', 'Apple', 'Outlook.com']}
              location={event.location}
              startDate={dayjs(startAt).format('YYYY-MM-DD')}
              endDate={dayjs(endAt).format('YYYY-MM-DD')}
              startTime={dayjs(startAt).format('HH:mm')}
              endTime={dayjs(endAt).format('HH:mm')}
              timeZone="Asia/Ho_Chi_Minh"
              language="vi"
              size="3"
              lightMode={theme === 'night' ? 'dark' : 'light'}
            />
            {guest?._id && !isPublic && (
              <Button variant="outlined" size="small" startIcon={<IoQrCodeOutline />} onClick={() => setShowQR(true)}>
                Mã check-in
              </Button>
            )}
          </div>
        </section>

        {event.message && <p className={styles.message}>{event.message}</p>}

        {countdown && (
          <RsvpForm event={event} guest={guest} isPublic={isPublic} onGuestChange={onGuestChange} />
        )}

        <WishesWall
          event={event}
          guest={guest}
          isPublic={isPublic}
          wishes={wishes}
          onPosted={wish => setWishes(list => [wish, ...list])}
        />

        <footer className={styles.footer}>
          <span>Thiệp được tạo miễn phí trên FollMe</span>
          <Link to="/cuoi-hoi?ref=invitation" onClick={() => track('invitation_footer_cta')}>
            Tạo thiệp của bạn →
          </Link>
        </footer>
      </div>

      {showQR && <QRModel value={guest._id} handleClose={() => setShowQR(false)} />}
    </div>
  );
}

function RsvpForm({ event, guest, isPublic, onGuestChange }) {
  const existing = guest?.rsvp;
  const [status, setStatus] = useState(existing?.status ?? 'attending');
  const [count, setCount] = useState(existing?.count || 1);
  const [note, setNote] = useState(existing?.note ?? '');
  const [name, setName] = useState(guest?.name ?? '');
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(!existing);

  async function submit(e) {
    e.preventDefault();
    if (isPublic && !guest?._id && !name.trim()) {
      toast.error('Vui lòng cho biết tên của bạn');
      return;
    }
    setIsSending(true);
    const payload = { status, count: status === 'declined' ? 1 : Number(count) || 1, note };
    try {
      let res;
      if (guest?._id) {
        res = await invitationApi.rsvp(guest._id, payload);
      } else {
        res = await invitationApi.rsvpPublic(event._id, { ...payload, name: name.trim() });
        savePublicGuest(event._id, { _id: res.guestId, name: name.trim() });
      }
      onGuestChange?.({ ...(guest ?? {}), _id: res.guestId ?? guest._id, name: guest?.name ?? name.trim(), rsvp: res.rsvp });
      track('rsvp_submitted', { status, public: Boolean(isPublic) });
      toast.success(status === 'declined' ? 'Đã gửi. Tiếc quá, hẹn bạn dịp khác!' : 'Đã xác nhận. Hẹn gặp bạn nhé!');
      setIsEditing(false);
    } catch (err) {
      console.log(err);
    } finally {
      setIsSending(false);
    }
  }

  if (!isEditing && guest?.rsvp) {
    return (
      <section className={styles.card}>
        <h2>Xác nhận tham dự</h2>
        <p className={styles.answered}>
          <IoCheckmarkCircle /> Bạn đã trả lời: <strong>{RSVP_LABELS[guest.rsvp.status]}</strong>
          {guest.rsvp.status !== 'declined' && guest.rsvp.count > 1 ? ` (${guest.rsvp.count} người)` : ''}
        </p>
        <Button size="small" onClick={() => setIsEditing(true)}>Đổi câu trả lời</Button>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <h2>Xác nhận tham dự</h2>
      <p className={styles.cardSub}>Giúp gia chủ chuẩn bị chu đáo hơn nhé.</p>
      <form className={styles.rsvp} onSubmit={submit}>
        {isPublic && !guest?._id && (
          <TextField size="small" label="Tên của bạn" value={name} inputProps={{ maxLength: 50 }} onChange={e => setName(e.target.value)} />
        )}
        <div className={styles.choices} role="radiogroup" aria-label="Bạn sẽ đến chứ?">
          {Object.entries(RSVP_LABELS).map(([value, label]) => (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={status === value}
              className={clsx(styles.choice, status === value && styles.chosen)}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {status !== 'declined' && (
          <TextField
            size="small"
            type="number"
            label="Số người (cả bạn)"
            value={count}
            inputProps={{ min: 1, max: 20 }}
            onChange={e => setCount(e.target.value)}
          />
        )}
        <TextField size="small" label="Nhắn gia chủ (không bắt buộc)" value={note} inputProps={{ maxLength: 300 }} onChange={e => setNote(e.target.value)} />
        <LoadingButton type="submit" variant="contained" loading={isSending}>Gửi xác nhận</LoadingButton>
      </form>
    </section>
  );
}

function WishesWall({ event, guest, isPublic, wishes, onPosted }) {
  const [message, setMessage] = useState('');
  const [name, setName] = useState(guest?.name ?? '');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (guest?.name) {
      setName(guest.name);
    }
  }, [guest?.name]);

  async function submit(e) {
    e.preventDefault();
    if (!message.trim()) {
      return;
    }
    if (isPublic && !name.trim()) {
      toast.error('Vui lòng cho biết tên của bạn');
      return;
    }
    setIsSending(true);
    try {
      const wish = guest?._id && !isPublic
        ? await invitationApi.wish(guest._id, { message: message.trim() })
        : await invitationApi.wishPublic(event._id, { message: message.trim(), name: name.trim() });
      onPosted(wish);
      setMessage('');
      track('wish_posted', { public: Boolean(isPublic) });
    } catch (err) {
      console.log(err);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className={styles.card}>
      <h2>Sổ lưu bút</h2>
      <p className={styles.cardSub}>Gửi một lời chúc, gia chủ sẽ đọc được ngay.</p>
      <form className={styles.wishForm} onSubmit={submit}>
        {isPublic && (
          <TextField size="small" label="Tên của bạn" value={name} inputProps={{ maxLength: 50 }} onChange={e => setName(e.target.value)} />
        )}
        <TextField
          multiline
          minRows={2}
          label="Lời chúc"
          value={message}
          inputProps={{ maxLength: 500 }}
          onChange={e => setMessage(e.target.value)}
        />
        <LoadingButton type="submit" variant="contained" loading={isSending} startIcon={<IoSend />} disabled={!message.trim()}>
          Gửi lời chúc
        </LoadingButton>
      </form>
      {wishes.length > 0 && (
        <ul className={styles.wishes}>
          {wishes.map(w => (
            <li key={w._id}>
              <IoHeart className={styles.wishIcon} />
              <div>
                <p>{w.message}</p>
                <span>{w.name} · {dayjs(w.createdAt).format('DD/MM/YYYY')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

