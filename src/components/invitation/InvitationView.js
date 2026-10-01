import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import {
  IoNavigateOutline, IoQrCodeOutline, IoSend, IoCheckmarkCircle, IoChevronDown, IoMailOpenOutline,
  IoCreateOutline, IoLocationOutline,
} from 'react-icons/io5';
import QRModel from 'pages/invitation/QRModel';
import Reveal from 'components/Reveal';
import Envelope from './Envelope';
import Petals from './Petals';
import MonthCalendar from './MonthCalendar';
import { getAlmanac, lunarMonthLabel } from 'util/fortune';
import { RSVP_LABELS, eventHeadline, invitationApi, isCoupleEvent, savePublicGuest } from 'util/invitation';
import { track } from 'util/analytics';
import styles from './InvitationView.module.scss';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const INTRO = {
  wedding: 'tới dự lễ thành hôn của',
  engagement: 'tới dự lễ ăn hỏi của',
};

const PETAL_COLORS = {
  blush: '#e8a3b0',
  classic: '#e0b04a',
  minimal: '#d4d4d8',
  night: '#d9b66b',
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

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function Ornament({ glyph = '✦' }) {
  return (
    <div className={styles.ornament} aria-hidden>
      <span /><i>{glyph}</i><span />
    </div>
  );
}

/**
 * The invitation a guest opens: an envelope first, then the story.
 *
 * - `guest` is set on a personal link; on the public link it is the guest
 *   this browser answered as, if any.
 * - `demo` keeps answers and wishes in the page (sample invitations).
 * - `embedded` skips the envelope and fixed overlays (editor preview).
 */
export default function InvitationView({
  event, guest, wishes: initialWishes = [], isPublic, onGuestChange, demo = false, embedded = false,
}) {
  const startAt = useMemo(() => new Date(event.startAt), [event.startAt]);
  const countdown = useCountdown(startAt);
  const [lunar, setLunar] = useState(null);
  const [wishes, setWishes] = useState(initialWishes);
  const [showQR, setShowQR] = useState(false);
  const [isOpen, setIsOpen] = useState(() => embedded || prefersReducedMotion());
  const theme = event.theme || 'minimal';
  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  const endAt = new Date(startAt.getTime() + 3 * 60 * 60 * 1000);
  const recipient = guest?.name && !isPublic ? guest.name : 'Bạn';
  const dateKey = dayjs(startAt).format('YYYY-MM-DD');

  useEffect(() => {
    setWishes(initialWishes);
  }, [initialWishes]);

  useEffect(() => {
    getAlmanac(dateKey).then(setLunar).catch(() => setLunar(null));
  }, [dateKey]);

  const onOpened = useCallback(() => {
    setIsOpen(true);
    track('invitation_opened', { theme, demo });
  }, [theme, demo]);

  return (
    <div className={clsx(styles.page, styles[theme], embedded && styles.embedded)}>
      {!isOpen && (
        <Envelope theme={theme} recipient={recipient} headline={eventHeadline(event)} onOpened={onOpened} />
      )}
      {isOpen && !embedded && <Petals count={14} color={PETAL_COLORS[theme]} />}

      {/* ---------- Cover ---------- */}
      <section className={styles.cover}>
        <div className={styles.coverFrame}>
          <p className={styles.kicker}>{couple ? 'Save the date' : 'Thư mời'}</p>
          <p className={styles.invite}>
            Trân trọng kính mời <strong>{recipient === 'Bạn' ? 'bạn' : recipient}</strong>
            <br />
            {INTRO[event.type] ?? 'tới dự'}
          </p>
          {couple ? (
            <h1 className={styles.couple}>
              <span className={styles.name}>{event.groomName}</span>
              <span className={styles.amp}>&amp;</span>
              <span className={styles.name}>{event.brideName}</span>
            </h1>
          ) : (
            <h1 className={styles.title}>{event.title}</h1>
          )}
          <div className={styles.seal} aria-hidden>{couple ? '囍' : '✦'}</div>
          <p className={styles.coverDate}>
            {dayjs(startAt).format('DD')}<i>·</i>{dayjs(startAt).format('MM')}<i>·</i>{dayjs(startAt).format('YYYY')}
          </p>
          <a href="#ngay" className={styles.scrollCue} aria-label="Xem tiếp">
            <IoChevronDown />
          </a>
        </div>
      </section>

      {event.message && (
        <Reveal className={styles.messageBlock}>
          <Ornament />
          <p className={styles.message}>{event.message}</p>
          <Ornament />
        </Reveal>
      )}

      {/* ---------- When ---------- */}
      <section id="ngay" className={styles.section}>
        <Reveal>
          <h2 className={styles.h2}>Ngày chung vui</h2>
          <p className={styles.when}>
            {WEEKDAYS[startAt.getDay()]} · {dayjs(startAt).format('HH:mm')}
          </p>
          {lunar && (
            <p className={styles.lunar}>
              Tức ngày {lunar.lunar.day} {lunarMonthLabel(lunar.lunar)} năm {lunar.yearName}
            </p>
          )}
        </Reveal>
        <Reveal delay={100}>
          <MonthCalendar date={startAt} />
        </Reveal>
        <Reveal delay={150}>
          {countdown ? (
            <div className={styles.countdown} aria-label="Đếm ngược">
              {[['days', 'Ngày'], ['hours', 'Giờ'], ['minutes', 'Phút'], ['seconds', 'Giây']].map(([key, label]) => (
                <div key={key}>
                  <strong>{String(countdown[key]).padStart(2, '0')}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.over}>Ngày vui đã qua. Cảm ơn bạn đã ghé thăm!</p>
          )}
        </Reveal>
      </section>

      {/* ---------- Where ---------- */}
      <section id="dia-diem" className={styles.section}>
        <Reveal>
          <h2 className={styles.h2}>Địa điểm</h2>
          <p className={styles.place}>{event.location}</p>
        </Reveal>
        {!embedded && (
          <Reveal delay={100} className={styles.map}>
            <iframe
              title="Bản đồ"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&z=15&output=embed`}
            />
          </Reveal>
        )}
        <Reveal delay={150} className={styles.whereActions}>
          <Button href={mapsUrl(event)} target="_blank" rel="noreferrer" variant="outlined" startIcon={<IoNavigateOutline />}>
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
          {guest?._id && !isPublic && !demo && (
            <Button variant="outlined" startIcon={<IoQrCodeOutline />} onClick={() => setShowQR(true)}>
              Mã check-in
            </Button>
          )}
        </Reveal>
      </section>

      {/* ---------- RSVP ---------- */}
      {countdown && (
        <section id="xac-nhan" className={styles.section}>
          <Reveal>
            <RsvpForm event={event} guest={guest} isPublic={isPublic} onGuestChange={onGuestChange} demo={demo} />
          </Reveal>
        </section>
      )}

      {/* ---------- Wishes ---------- */}
      <section id="loi-chuc" className={styles.section}>
        <Reveal>
          <WishesWall
            event={event}
            guest={guest}
            isPublic={isPublic}
            wishes={wishes}
            demo={demo}
            onPosted={wish => setWishes(list => [wish, ...list])}
          />
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <Ornament glyph={couple ? '囍' : '✦'} />
        <p className={styles.thanks}>{couple ? 'Rất hân hạnh được đón tiếp!' : 'Hẹn gặp bạn!'}</p>
        <div className={styles.made}>
          <span>Thiệp được làm miễn phí trên FollMe</span>
          <Link to="/cuoi-hoi?ref=invitation" onClick={() => track('invitation_footer_cta', { demo })}>
            {demo ? 'Tạo thiệp của bạn' : 'Tạo thiệp như thế này'} →
          </Link>
        </div>
      </footer>

      {/* ---------- Quick actions ---------- */}
      {isOpen && !embedded && (
        <nav className={styles.dock} aria-label="Đi nhanh">
          {countdown && <a href="#xac-nhan"><IoMailOpenOutline /> Xác nhận</a>}
          <a href="#dia-diem"><IoLocationOutline /> Chỉ đường</a>
          <a href="#loi-chuc"><IoCreateOutline /> Lời chúc</a>
        </nav>
      )}

      {showQR && <QRModel value={guest._id} handleClose={() => setShowQR(false)} />}
    </div>
  );
}

function RsvpForm({ event, guest, isPublic, onGuestChange, demo }) {
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
      if (demo) {
        res = { guestId: 'demo', rsvp: { ...payload, count: status === 'declined' ? 0 : payload.count } };
      } else if (guest?._id) {
        res = await invitationApi.rsvp(guest._id, payload);
      } else {
        res = await invitationApi.rsvpPublic(event._id, { ...payload, name: name.trim() });
        savePublicGuest(event._id, { _id: res.guestId, name: name.trim() });
      }
      onGuestChange?.({ ...(guest ?? {}), _id: res.guestId ?? guest._id, name: guest?.name ?? name.trim(), rsvp: res.rsvp });
      track('rsvp_submitted', { status, public: Boolean(isPublic), demo });
      toast.success(demo
        ? 'Thiệp mẫu: câu trả lời không được gửi đi. Tạo thiệp của bạn để dùng thật nhé!'
        : (status === 'declined' ? 'Đã gửi. Tiếc quá, hẹn bạn dịp khác!' : 'Đã xác nhận. Hẹn gặp bạn nhé!'));
      setIsEditing(false);
    } catch (err) {
      console.log(err);
    } finally {
      setIsSending(false);
    }
  }

  if (!isEditing && guest?.rsvp) {
    return (
      <div className={styles.card}>
        <h2 className={styles.h2}>Xác nhận tham dự</h2>
        <p className={styles.answered}>
          <IoCheckmarkCircle /> Bạn đã trả lời: <strong>{RSVP_LABELS[guest.rsvp.status]}</strong>
          {guest.rsvp.status !== 'declined' && guest.rsvp.count > 1 ? ` (${guest.rsvp.count} người)` : ''}
        </p>
        <Button size="small" className={styles.textButton} onClick={() => setIsEditing(true)}>Đổi câu trả lời</Button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.h2}>Bạn sẽ đến chứ?</h2>
      <p className={styles.cardSub}>Một câu trả lời nhỏ giúp gia chủ chuẩn bị chu đáo hơn.</p>
      <form className={styles.form} onSubmit={submit}>
        {isPublic && !guest?._id && (
          <TextField size="small" label="Tên của bạn" value={name} inputProps={{ maxLength: 50 }} onChange={e => setName(e.target.value)} />
        )}
        <div className={styles.choices} role="radiogroup" aria-label="Bạn sẽ đến chứ?">
          {[['attending', '🥂', 'Chắc chắn rồi'], ['maybe', '🤔', 'Chưa chắc'], ['declined', '💌', 'Tiếc quá']].map(([value, icon, label]) => (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={status === value}
              aria-label={RSVP_LABELS[value]}
              className={clsx(styles.choice, status === value && styles.chosen)}
              onClick={() => setStatus(value)}
            >
              <span aria-hidden>{icon}</span>
              {label}
            </button>
          ))}
        </div>
        {status !== 'declined' && (
          <div className={styles.counter}>
            <span>Đi mấy người?</span>
            <button type="button" aria-label="Bớt một người" onClick={() => setCount(c => Math.max(1, Number(c) - 1))}>−</button>
            <strong aria-live="polite">{count}</strong>
            <button type="button" aria-label="Thêm một người" onClick={() => setCount(c => Math.min(20, Number(c) + 1))}>+</button>
          </div>
        )}
        <TextField size="small" label="Nhắn gia chủ (không bắt buộc)" value={note} inputProps={{ maxLength: 300 }} onChange={e => setNote(e.target.value)} />
        <LoadingButton type="submit" variant="contained" size="large" loading={isSending}>Gửi xác nhận</LoadingButton>
      </form>
    </div>
  );
}

function WishesWall({ event, guest, isPublic, wishes, onPosted, demo }) {
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
    if ((isPublic || demo) && !name.trim()) {
      toast.error('Vui lòng cho biết tên của bạn');
      return;
    }
    setIsSending(true);
    try {
      let wish;
      if (demo) {
        wish = { _id: `demo-${Date.now()}`, name: name.trim(), message: message.trim(), createdAt: new Date().toISOString() };
      } else if (guest?._id && !isPublic) {
        wish = await invitationApi.wish(guest._id, { message: message.trim() });
      } else {
        wish = await invitationApi.wishPublic(event._id, { message: message.trim(), name: name.trim() });
      }
      onPosted(wish);
      setMessage('');
      track('wish_posted', { public: Boolean(isPublic), demo });
    } catch (err) {
      console.log(err);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div>
      <h2 className={styles.h2}>Sổ lưu bút</h2>
      <p className={styles.cardSub}>Để lại một lời chúc, gia chủ sẽ đọc được ngay.</p>
      <form className={clsx(styles.card, styles.form)} onSubmit={submit}>
        {(isPublic || demo) && (
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
          {wishes.map((w, i) => (
            <li key={w._id} style={{ '--tilt': `${((i * 37) % 7) - 3}deg` }}>
              <p>{w.message}</p>
              <span>— {w.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
