import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import QRCode from 'react-qr-code';
import dayjs from 'dayjs';
import { IoExpandOutline, IoContractOutline } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { eventHeadline, invitationApi, isCoupleEvent, isGoneError, wishesUrl } from 'util/invitation';
import { DEMO_WISHES, demoEvent } from 'util/demoInvitation';
import { vnWallClock } from 'util/date';
import { cldUrl } from 'util/photos';
import { burst } from 'util/confetti';
import { setPageMeta } from 'util/meta';
import styles from './LiveScreen.module.scss';

const POLL_MS = 5000;
// How long a wish stays in the spotlight; a new one gets a little longer
const SPOT_MS = 9000;
const NEW_SPOT_MS = 12000;
const SLIDE_MS = 7000;

const CONFETTI = {
  blush: ['#e8a3b0', '#f6e3b4', '#c45c74', '#ffffff', '#d9b66b'],
  classic: ['#a3201e', '#e0b04a', '#f3dc94', '#fff4e2'],
  minimal: ['#18181b', '#a1a1aa', '#e4e4e7', '#d4af37'],
  night: ['#d9b66b', '#f3ead7', '#8aa0ff', '#ffffff'],
};

// Sample wishes that "arrive" on the sample screen
const DEMO_ARRIVALS = [
  { name: 'Bàn 7 - đồng nghiệp', message: 'Chúc mừng hạnh phúc! Cô dâu hôm nay xinh quá trời 😍' },
  { name: 'Ông bà nội', message: 'Chúc hai cháu thuận vợ thuận chồng, tát biển Đông cũng cạn.' },
  { name: 'Nhóm đá banh thứ Bảy', message: 'Chú rể từ nay xin phép vợ trước khi ra sân nha 🤣⚽' },
  { name: 'Chị Hạnh', message: 'Mãi hạnh phúc như hôm nay nhé hai đứa!' },
  { name: 'Bạn thân cô dâu', message: 'Thương nhau, nhường nhau, và nhớ đi du lịch đều đều nha. Love you!' },
];

/**
 * Merges polled changes into the wall (newest first): hidden wishes leave,
 * unseen ones join. Returns the new list and the wishes that are new.
 */
export function mergeWishes(list, changes) {
  const byId = new Map(list.map(w => [w._id, w]));
  const added = [];
  for (const wish of changes) {
    if (wish.isHidden) {
      byId.delete(wish._id);
    } else if (byId.has(wish._id)) {
      byId.set(wish._id, wish);
    } else {
      byId.set(wish._id, wish);
      added.push(wish);
    }
  }
  const next = [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { list: next, added };
}

/** Size class for a wish in the spotlight, so long ones still fit. */
export function spotSize(message = '') {
  if (message.length <= 70) {
    return 'large';
  }
  return message.length <= 180 ? 'medium' : 'small';
}

function useWakeLock() {
  useEffect(() => {
    let lock = null;
    async function request() {
      try {
        lock = await navigator.wakeLock?.request('screen');
      } catch (err) {
        // Not supported or not allowed: the TV's own settings apply
      }
    }
    function onVisibility() {
      if (!document.hidden) {
        request();
      }
    }
    request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release?.().catch(() => {});
    };
  }, []);
}

/** The controls fade out when the mouse rests, so the TV shows only the wall. */
function useIdle(ms = 3000) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), ms);
    function wake() {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), ms);
    }
    window.addEventListener('pointermove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [ms]);
  return idle;
}

/**
 * The wishes wall for a TV or projector at the party (/man-hinh/:id/:key).
 * Guests scan the QR, write a wish on their phone, and it appears here a
 * few seconds later. The sample at /man-hinh/mau simulates arrivals.
 */
export default function LiveScreen({ demo = false }) {
  const { eventId, key } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [failed, setFailed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [spot, setSpot] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cursor = useRef(null);
  const wishesRef = useRef([]);
  const queue = useRef([]);
  const rotation = useRef(0);
  const spotTimer = useRef(null);
  const spotRef = useRef(null);
  const spotCard = useRef(null);
  const idle = useIdle();
  useWakeLock();

  wishesRef.current = wishes;
  spotRef.current = spot;

  const advance = useCallback(() => {
    clearTimeout(spotTimer.current);
    const list = wishesRef.current;
    // Skip queued wishes the host hid before their turn
    while (queue.current.length && !list.some(w => w._id === queue.current[0]._id)) {
      queue.current.shift();
    }
    const fresh = queue.current.shift();
    let next = null;
    if (fresh) {
      next = { wish: fresh, isNew: true };
    } else if (list.length) {
      next = { wish: list[rotation.current % list.length], isNew: false };
      rotation.current += 1;
    }
    setSpot(next);
    spotTimer.current = setTimeout(advance, fresh ? NEW_SPOT_MS : SPOT_MS);
  }, []);

  useEffect(() => () => clearTimeout(spotTimer.current), []);

  const receive = useCallback((changes) => {
    if (!changes.length) {
      return;
    }
    const { list, added } = mergeWishes(wishesRef.current, changes);
    wishesRef.current = list;
    setWishes(list);
    // Oldest first, so a burst of wishes is shown in the order written
    queue.current.push(...[...added].reverse());
    const current = spotRef.current;
    const currentGone = current && !list.some(w => w._id === current.wish._id);
    if (currentGone || (added.length && !current?.isNew)) {
      advance();
    }
  }, [advance]);

  // First load
  useEffect(() => {
    if (demo) {
      const sample = demoEvent(searchParams.get('theme') || 'night');
      setEvent(sample);
      setWishes(DEMO_WISHES);
      wishesRef.current = DEMO_WISHES;
      setPageMeta({ title: 'Màn hình lời chúc (mẫu)' });
      return undefined;
    }
    let isActive = true;
    invitationApi.screen(eventId, key)
      .then(res => {
        if (!isActive) {
          return;
        }
        cursor.current = res.cursor;
        setEvent(res.event);
        setWishes(res.wishes);
        wishesRef.current = res.wishes;
        setPageMeta({ title: `Lời chúc · ${eventHeadline(res.event)}` });
      })
      .catch(() => isActive && setFailed(true));
    return () => {
      isActive = false;
    };
  }, [demo, eventId, key, searchParams]);

  // Start the spotlight once there is something to show
  useEffect(() => {
    if (event && !spotRef.current) {
      advance();
    }
  }, [event, wishes.length, advance]);

  // Poll for new and hidden wishes
  useEffect(() => {
    if (!event || demo) {
      return undefined;
    }
    let stopped = false;
    let timer;
    async function tick() {
      try {
        const res = await invitationApi.screen(eventId, key, cursor.current);
        cursor.current = res.cursor;
        setOffline(false);
        receive(res.wishes);
      } catch (err) {
        if (isGoneError(err)) {
          // The host made a new link: this one will not work again.
          // Anything else (a deploy, a hiccup) is retried: it is a party.
          setFailed(true);
          return;
        }
        setOffline(true);
      }
      if (!stopped) {
        timer = setTimeout(tick, POLL_MS);
      }
    }
    timer = setTimeout(tick, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [event, demo, eventId, key, receive]);

  // The sample screen: a wish "arrives" now and then
  useEffect(() => {
    if (!demo || !event) {
      return undefined;
    }
    let n = 0;
    const id = setInterval(() => {
      const sample = DEMO_ARRIVALS[n % DEMO_ARRIVALS.length];
      n += 1;
      receive([{ ...sample, _id: `demo-live-${n}`, createdAt: new Date().toISOString() }]);
    }, 14000);
    return () => clearInterval(id);
  }, [demo, event, receive]);

  // Confetti for each new wish in the spotlight
  useEffect(() => {
    if (!spot?.isNew || !event) {
      return;
    }
    const rect = spotCard.current?.getBoundingClientRect();
    burst({
      x: rect ? rect.left + rect.width / 2 : undefined,
      y: rect ? rect.top + rect.height * 0.3 : undefined,
      colors: CONFETTI[event.theme] ?? CONFETTI.night,
      count: 120,
    });
  }, [spot, event]);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  const wall = useMemo(
    () => wishes.filter(w => w._id !== spot?.wish._id).slice(0, 24),
    [wishes, spot],
  );

  if (failed) {
    return (
      <div className="container page empty-state">
        Link màn hình không đúng hoặc đã được gia chủ đổi. Hãy lấy link mới trong trang quản lý thiệp.
      </div>
    );
  }
  if (!event) {
    return <OvalLoading />;
  }

  const theme = event.theme || 'night';
  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  const shownAt = vnWallClock(event.startAt);
  const qrUrl = demo ? `${window.location.origin}/thiep-mau#loi-chuc` : event.allowPublicLink && wishesUrl(event._id);

  return (
    <div className={clsx(styles.screen, styles[theme], idle && styles.idle)}>
      <aside className={styles.side}>
        <Slideshow photos={event.photos ?? []} glyph={couple ? '囍' : '✦'} />
        <h1 className={styles.names}>
          {couple ? (
            <>
              <span>{event.groomName}</span>
              <i>&amp;</i>
              <span>{event.brideName}</span>
            </>
          ) : (
            <span>{event.title}</span>
          )}
        </h1>
        <p className={styles.date}>{dayjs(shownAt).format('DD · MM · YYYY')}</p>

        {qrUrl ? (
          <div className={styles.qrCard}>
            <div className={styles.qr}>
              <QRCode value={qrUrl} size={256} level="M" style={{ width: '100%', height: 'auto' }} />
            </div>
            <p>
              <strong>Quét mã</strong>
              để gửi lời chúc lên màn hình
            </p>
          </div>
        ) : (
          <p className={styles.hint}>Mở thiệp mời và gửi lời chúc ở mục Sổ lưu bút</p>
        )}
      </aside>

      <main className={styles.stage}>
        <p className={styles.count}>
          <strong>{wishes.length}</strong> lời chúc
        </p>
        {spot ? (
          <figure
            key={spot.wish._id}
            ref={spotCard}
            className={clsx(styles.spot, styles[spotSize(spot.wish.message)], spot.isNew && styles.isNew)}
          >
            {spot.isNew && <span className={styles.newBadge}>Lời chúc mới</span>}
            <blockquote>{spot.wish.message}</blockquote>
            <figcaption>— {spot.wish.name}</figcaption>
          </figure>
        ) : (
          <div className={styles.empty}>
            <p>Chưa có lời chúc nào.</p>
            <p>Hãy là người đầu tiên gửi lời chúc!</p>
          </div>
        )}
        {wall.length > 0 && <WishWall wishes={wall} />}
      </main>

      <footer className={styles.brand}>Thiệp &amp; màn hình lời chúc miễn phí tại FollMe</footer>

      {offline && <p className={styles.offline} role="status">Đang kết nối lại…</p>}

      <button
        type="button"
        className={clsx(styles.fullscreen, idle && styles.hidden)}
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
      >
        {isFullscreen ? <IoContractOutline /> : <IoExpandOutline />}
        <span>{isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}</span>
      </button>
    </div>
  );
}

/** The couple's photos, one after another, in the arch. */
function Slideshow({ photos, glyph }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (photos.length < 2) {
      return undefined;
    }
    const id = setInterval(() => setIndex(i => (i + 1) % photos.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [photos.length]);

  if (!photos.length) {
    return <div className={styles.seal} aria-hidden>{glyph}</div>;
  }
  return (
    <div className={styles.arch}>
      {photos.map((photo, i) => (
        <img
          key={photo._id ?? photo.url}
          src={cldUrl(photo.url, 'w_720,h_900,c_fill,g_faces')}
          alt=""
          className={clsx(i === index % photos.length && styles.shown)}
        />
      ))}
    </div>
  );
}

/**
 * The other wishes as a ticker along the bottom. With enough of them it
 * scrolls forever: the list is drawn twice and slides by half its width.
 */
function WishWall({ wishes }) {
  const scrolls = wishes.length >= 4;
  const items = scrolls ? [...wishes, ...wishes] : wishes;
  return (
    <div className={styles.wallWindow}>
      <ul
        className={clsx(styles.wall, scrolls && styles.scrolling)}
        style={scrolls ? { '--duration': `${wishes.length * 6}s` } : undefined}
      >
        {items.map((w, i) => (
          <li key={`${w._id}-${i}`} aria-hidden={i >= wishes.length || undefined}>
            <p>{w.message}</p>
            <span>— {w.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
