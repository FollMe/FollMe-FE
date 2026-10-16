import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import {
  IoNavigateOutline, IoSend, IoCheckmarkCircle, IoChevronDown, IoMailOpenOutline, IoMusicalNotes,
  IoCreateOutline, IoLocationOutline, IoGiftOutline, IoImagesOutline, IoBusOutline,
  IoShirtOutline, IoCarOutline, IoHappyOutline, IoBedOutline, IoInformationCircleOutline,
} from 'react-icons/io5';
import Reveal from 'components/Reveal';
import Envelope from './Envelope';
import Petals from './Petals';
import MonthCalendar from './MonthCalendar';
import MusicToggle from './MusicToggle';
import GiftBox from './GiftBox';
import AddToCalendar from './AddToCalendar';
import ScratchReveal from './ScratchReveal';
import PhotoAlbum from './PhotoAlbum';
import ProgramTimeline from './ProgramTimeline';
import SeatFinder from './SeatFinder';
import GuestPhotos, { guestPhotosOpen } from './GuestPhotos';
import ArriveCard, { selfCheckInOpen } from './ArriveCard';
import StoryTimeline from './StoryTimeline';
import { CardLangProvider, LangSwitch, useCardText } from './CardLang';
import { getAlmanac, lunarMonthLabel } from 'util/fortune';
import {
  eventHeadline, invitationApi, isCoupleEvent, rememberOpened, savePublicGuest, seatFinderOpen, wasOpened,
} from 'util/invitation';
import { track } from 'util/analytics';
import { isAwayFromVietnam, vnWallClock } from 'util/date';
import { burst } from 'util/confetti';
import { MusicBox, canPlayMusic } from 'util/musicBox';
import { cldUrl } from 'util/photos';
import { daysToAnswer } from 'util/inviteMessage';
import { MAX_SONG } from 'util/songs';
import { cardText, initialCardLang, saveCardLang } from 'util/cardText';
import { guestShuttle, seatsLeft, shuttleWhen } from 'util/shuttles';
import { menuOpen } from 'util/menu';
import styles from './InvitationView.module.scss';

// After the party the card thanks the guest (the host's thank-you links here).
// Until then the party is on: guests are asked for a wish
const LIVE_MS = 8 * 60 * 60 * 1000;
// A guest's table shows on their card from a little before the party
const SEAT_BEFORE_MS = 3 * 60 * 60 * 1000;

const PETAL_COLORS = {
  blush: '#e8a3b0',
  classic: '#e0b04a',
  minimal: '#d4d4d8',
  night: '#d9b66b',
  garden: '#9fb89a',
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

// "Lưu ý nhỏ": an icon per topic
const NOTE_ICONS = {
  dress: IoShirtOutline, parking: IoCarOutline, kids: IoHappyOutline, stay: IoBedOutline,
};

// Foil of the scratch-off date and colors of the confetti, per theme
const FOILS = { blush: 'rose', classic: 'gold', minimal: 'silver', night: 'gold', garden: 'gold' };
const CONFETTI = {
  blush: ['#e8a3b0', '#f6e3b4', '#c45c74', '#ffffff', '#d9b66b'],
  classic: ['#a3201e', '#e0b04a', '#f3dc94', '#fff4e2'],
  minimal: ['#18181b', '#a1a1aa', '#e4e4e7', '#d4af37'],
  night: ['#d9b66b', '#f3ead7', '#8aa0ff', '#ffffff'],
  garden: ['#5f7f5f', '#9fb89a', '#e8d9a8', '#ffffff', '#c9b27a'],
};

/**
 * The background music box. It can only start from a tap (browser rule), so
 * `play` is called from the envelope's seal or the music button. Pauses
 * while the tab is hidden.
 */
function useMusic(enabled) {
  const box = useRef(null);
  const resumeOnShow = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    if (!enabled || !canPlayMusic()) {
      return;
    }
    try {
      box.current = box.current ?? new MusicBox();
      box.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } catch (err) {
      // No audio on this device: the invitation works without it
    }
  }, [enabled]);

  const pause = useCallback(() => {
    box.current?.pause();
    setIsPlaying(false);
  }, []);

  useEffect(() => () => box.current?.close(), []);

  useEffect(() => {
    function onVisibility() {
      if (document.hidden && isPlaying) {
        resumeOnShow.current = true;
        box.current?.pause();
      } else if (!document.hidden && resumeOnShow.current) {
        resumeOnShow.current = false;
        box.current?.play();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isPlaying]);

  return { isPlaying, play, toggle: isPlaying ? pause : play };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Guests scanning the QR on the venue screen land on the wishes, not the envelope. */
function opensOnWishes() {
  return typeof window !== 'undefined' && window.location.hash === '#loi-chuc';
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
  event, guest, wishes: initialWishes = [], isPublic, onGuestChange, demo = false, embedded = false, lang: fixedLang,
}) {
  // Vietnamese or English: what this browser chose, the link's ?lang=, or
  // what the host set for this guest. Previews show the language asked for.
  const [chosenLang, setChosenLang] = useState(() => fixedLang ?? (embedded ? 'vi' : initialCardLang({ eventId: event._id, guest })));
  const lang = fixedLang ?? chosenLang;
  const t = cardText(lang);
  const startAt = useMemo(() => new Date(event.startAt), [event.startAt]);
  const countdown = useCountdown(startAt);
  const isOver = !countdown;
  const isLive = isOver && Date.now() - startAt.getTime() < LIVE_MS;
  const showSeat = Boolean(guest?.table) && startAt.getTime() - Date.now() < SEAT_BEFORE_MS
    && Date.now() - startAt.getTime() < LIVE_MS;
  // Shown in Vietnam time, where the event is, also to guests abroad: the
  // calendar button says Asia/Ho_Chi_Minh, so its times must be Vietnam's.
  const shownAt = useMemo(() => vnWallClock(event.startAt), [event.startAt]);
  const [lunar, setLunar] = useState(null);
  const [wishes, setWishes] = useState(initialWishes);
  // Samples always play the envelope; real invitations only the first time
  const openedKey = demo || embedded ? null : (guest?._id && !isPublic ? `g.${guest._id}` : `e.${event._id}`);
  const [isOpen, setIsOpen] = useState(() => (
    embedded || prefersReducedMotion() || opensOnWishes() || wasOpened(openedKey)
  ));
  const theme = event.theme || 'minimal';
  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  // On the public link, the name they gave when answering
  const guestName = guest?.name || '';
  const coverText = t.cover({ name: guestName, type: event.type, isOver });
  // Weddings get the music box and the scratch-off date unless the host
  // turned them off; other events only if turned on.
  const withMusic = !embedded && (event.music ? event.music !== 'none' : isCoupleEvent(event.type));
  // Nothing to reveal once the day has come
  const withScratch = !embedded && !isOver && (event.scratchDate ?? isCoupleEvent(event.type));
  const music = useMusic(withMusic);
  const dateKey = dayjs(shownAt).format('YYYY-MM-DD');
  const photos = event.photos ?? [];
  const coverPhoto = photos[0];
  const message = lang === 'en' && event.messageEn ? event.messageEn : event.message;

  // Screen readers, translation and the tab title follow the card's language
  useEffect(() => {
    if (embedded) {
      return undefined;
    }
    const root = document.documentElement;
    const previous = { lang: root.lang, title: document.title };
    root.lang = lang;
    if (lang === 'en') {
      document.title = `${t.pageTitle(eventHeadline(event))} | FollMe`;
    }
    return () => {
      root.lang = previous.lang;
      document.title = previous.title;
    };
  }, [embedded, lang, t, event]);

  const switchLang = useCallback(next => {
    setChosenLang(next);
    saveCardLang(event._id, next);
    track('card_language', { lang: next, demo });
  }, [event._id, demo]);

  useEffect(() => {
    setWishes(initialWishes);
  }, [initialWishes]);

  // The browser jumped to #loi-chuc before the invitation was rendered
  useEffect(() => {
    if (!embedded && opensOnWishes()) {
      document.getElementById('loi-chuc')?.scrollIntoView();
    }
  }, [embedded]);

  useEffect(() => {
    // The lunar date is a nicety: never bother a guest with its errors
    getAlmanac(dateKey, { quiet: true }).then(setLunar).catch(() => setLunar(null));
  }, [dateKey]);

  const onOpened = useCallback(() => {
    setIsOpen(true);
    rememberOpened(openedKey);
    track('invitation_opened', { theme, demo });
  }, [theme, demo, openedKey]);

  const onDateRevealed = useCallback(({ x, y }) => {
    burst({ x, y, colors: CONFETTI[theme] });
    navigator.vibrate?.(30);
    track('invitation_date_revealed', { theme, demo });
  }, [theme, demo]);

  return (
    <CardLangProvider value={lang}>
    <div className={clsx(styles.page, styles[theme], embedded && styles.embedded, isOpen && styles.opened)} lang={lang}>
      {!embedded && !fixedLang && <LangSwitch lang={lang} onChange={switchLang} />}
      {!isOpen && (
        <Envelope
          theme={theme}
          recipient={guestName || t.recipient('')}
          headline={eventHeadline(event)}
          withMusic={withMusic && canPlayMusic()}
          onOpenStart={music.play}
          onOpened={onOpened}
        />
      )}
      {isOpen && !embedded && <Petals count={14} color={PETAL_COLORS[theme]} />}

      {/* ---------- Cover ---------- */}
      <section className={styles.cover}>
        <div className={styles.coverFrame}>
          {coverPhoto && (
            <figure className={styles.coverPhoto}>
              <img
                src={cldUrl(coverPhoto.url, 'w_600,h_750,c_fill,g_faces')}
                alt={couple ? t.coupleAlt(event.groomName, event.brideName) : ''}
                fetchpriority="high"
              />
            </figure>
          )}
          <p className={styles.kicker}>{t.kicker({ couple, isOver })}</p>
          <p className={styles.invite}>
            {coverText.lead}{coverText.who && <strong>{coverText.who}</strong>}{coverText.tail}
            <br />
            {coverText.line}
          </p>
          {couple ? (
            <h1 className={styles.couple}>
              <span className={clsx(styles.name, styles.shimmer)}>{event.groomName}</span>
              <span className={styles.amp}>&amp;</span>
              <span className={clsx(styles.name, styles.shimmer)}>{event.brideName}</span>
            </h1>
          ) : (
            <h1 className={clsx(styles.title, styles.shimmer)}>{event.title}</h1>
          )}
          {!coverPhoto && <div className={styles.seal} aria-hidden>{couple ? '囍' : '✦'}</div>}
          {withScratch ? (
            <ScratchReveal
              className={styles.coverScratch}
              label={t.scratch(couple)}
              keyHint={t.scratchKey}
              foil={FOILS[theme]}
              onReveal={onDateRevealed}
            >
              <CoverDate date={shownAt} />
            </ScratchReveal>
          ) : (
            <CoverDate date={shownAt} />
          )}
          {showSeat && (
            <p className={styles.coverSeat}>
              {t.seatLead(guestName)}<strong>{t.table(guest.table)}</strong>
            </p>
          )}
          <a href="#ngay" className={styles.scrollCue} aria-label={t.scrollCue}>
            <IoChevronDown />
          </a>
        </div>
      </section>

      {/* At the door: the guest checks themselves in */}
      {!demo && !embedded && guest?._id && selfCheckInOpen(event.startAt) && (
        <section id="da-den" className={styles.section}>
          <ArriveCard guest={guest} onGuestChange={onGuestChange} />
        </section>
      )}

      {/* On the day, the shared link finds a seat by name (when there is a seating plan) */}
      {isPublic && !demo && !embedded && !showSeat && seatFinderOpen(event.startAt) && (
        <section id="tim-ban" className={styles.section}>
          <SeatFinder eventId={event._id} headingClassName={styles.h2} />
        </section>
      )}

      {message && (
        <Reveal className={styles.messageBlock}>
          <Ornament />
          <p className={styles.message} lang={message === event.messageEn ? 'en' : 'vi'}>{message}</p>
          <Ornament />
        </Reveal>
      )}

      {/* ---------- The couple's story ---------- */}
      {couple && event.story?.length > 0 && (
        <section id="chuyen-tinh-yeu" className={styles.section}>
          <Reveal>
            <StoryTimeline story={event.story} headingClassName={styles.h2} />
          </Reveal>
        </section>
      )}

      {/* ---------- Album ---------- */}
      {photos.length > 1 && (
        <section id="album" className={styles.section}>
          <Reveal>
            <PhotoAlbum photos={photos} title={t.album(couple)} demo={demo} />
          </Reveal>
        </section>
      )}

      {/* ---------- When ---------- */}
      <section id="ngay" className={styles.section}>
        <Reveal>
          <h2 className={styles.h2}>{t.whenTitle}</h2>
          <p className={styles.when}>{t.when(shownAt, !embedded && isAwayFromVietnam())}</p>
          {lunar && <p className={styles.lunar}>{t.lunar(lunar, lunarMonthLabel(lunar.lunar))}</p>}
        </Reveal>
        <Reveal delay={100}>
          <MonthCalendar date={shownAt} />
        </Reveal>
        <Reveal delay={150}>
          {countdown ? (
            <div className={styles.countdown} aria-label={t.countdown}>
              {['days', 'hours', 'minutes', 'seconds'].map(key => (
                <div key={key}>
                  <strong>{String(countdown[key]).padStart(2, '0')}</strong>
                  <span>{t.units[key]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.over}>
              {isLive ? t.liveNow : t.passed}
            </p>
          )}
        </Reveal>
        {event.program?.length > 0 && (!isOver || isLive) && (
          <Reveal delay={200}>
            <ProgramTimeline program={event.program} startAt={event.startAt} />
          </Reveal>
        )}
      </section>

      {/* ---------- Where ---------- */}
      <section id="dia-diem" className={styles.section}>
        <Reveal>
          <h2 className={styles.h2}>{t.whereTitle}</h2>
          <p className={styles.place}>{event.location}</p>
        </Reveal>
        {!embedded && (
          <Reveal delay={100} className={styles.map}>
            <iframe
              title={t.map}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&z=15&output=embed`}
            />
          </Reveal>
        )}
        <Reveal delay={150} className={styles.whereActions}>
          <Button href={mapsUrl(event)} target="_blank" rel="noreferrer" variant="outlined" startIcon={<IoNavigateOutline />}>
            {t.directions}
          </Button>
          <AddToCalendar event={event} />
        </Reveal>
      </section>

      {/* ---------- The menu, around the day ---------- */}
      {event.menu?.length > 0 && (embedded || menuOpen(event.startAt)) && (
        <section id="thuc-don" className={styles.section}>
          <Reveal className={styles.menu}>
            <h2 className={styles.h2}>{t.menuTitle}</h2>
            <Ornament />
            <ol>
              {event.menu.map((dish, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={`${dish}-${i}`}>{dish}</li>
              ))}
            </ol>
            <Ornament />
          </Reveal>
        </section>
      )}

      {/* ---------- Good to know ---------- */}
      {event.notes?.length > 0 && (
        <section id="luu-y" className={styles.section}>
          <Reveal>
            <h2 className={styles.h2}>{t.notesTitle}</h2>
            <ul className={styles.notes}>
              {event.notes.map((note, i) => {
                const Icon = NOTE_ICONS[note.kind] ?? IoInformationCircleOutline;
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`${note.kind}-${i}`}>
                    <Icon aria-hidden />
                    <div>
                      <h3>{note.kind === 'other' ? note.title : t.noteKinds[note.kind]}</h3>
                      <p>{note.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </section>
      )}

      {/* ---------- RSVP ---------- */}
      {countdown && (
        <section id="xac-nhan" className={styles.section}>
          <Reveal>
            <RsvpForm event={event} guest={guest} isPublic={isPublic} onGuestChange={onGuestChange} demo={demo} />
          </Reveal>
        </section>
      )}

      {/* ---------- Gifts ---------- */}
      {event.gifts?.length > 0 && (
        <section id="mung-cuoi" className={styles.section}>
          <Reveal>
            <GiftBox event={event} guest={guest} demo={demo} onGuestChange={onGuestChange} />
          </Reveal>
        </section>
      )}

      {/* ---------- Photos guests took ---------- */}
      {!demo && !embedded && (event.guestPhotos?.length > 0 || guestPhotosOpen(event.startAt)) && (
        <section id="anh-khach" className={styles.section}>
          <GuestPhotos event={event} guest={guest} headingClassName={styles.h2} />
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
        <p className={styles.thanks}>{t.footer(couple)}</p>
        <div className={styles.made}>
          <span>{t.madeWith}</span>
          <Link to="/cuoi-hoi?ref=invitation" onClick={() => track('invitation_footer_cta', { demo })}>
            {t.makeOne(demo)} →
          </Link>
        </div>
      </footer>

      {/* ---------- Quick actions ---------- */}
      {isOpen && !embedded && (
        <nav className={styles.dock} aria-label={t.dock.label}>
          {countdown && <a href="#xac-nhan"><IoMailOpenOutline /> {t.dock.rsvp}</a>}
          {/* After the party: the photos instead of the way there */}
          {isOver && !isLive && photos.length > 1 ? (
            <a href="#album"><IoImagesOutline /> {t.dock.photos}</a>
          ) : (
            (!isOver || isLive) && <a href="#dia-diem"><IoLocationOutline /> {t.dock.directions}</a>
          )}
          {event.gifts?.length > 0 && <a href="#mung-cuoi"><IoGiftOutline /> {t.dock.gift(couple)}</a>}
          <a href="#loi-chuc"><IoCreateOutline /> {t.dock.wishes}</a>
        </nav>
      )}

      {isOpen && withMusic && canPlayMusic() && <MusicToggle isPlaying={music.isPlaying} onToggle={music.toggle} />}

    </div>
    </CardLangProvider>
  );
}

function CoverDate({ date }) {
  return (
    <p className={styles.coverDate}>
      {dayjs(date).format('DD')}<i>·</i>{dayjs(date).format('MM')}<i>·</i>{dayjs(date).format('YYYY')}
    </p>
  );
}

/** Why to answer, and by when if the host set a date. */
function answerHint(event, r) {
  if (!event.rsvpBy) {
    return r.hint;
  }
  const day = r.day(event.rsvpBy);
  return daysToAnswer(event.rsvpBy) >= 0 ? r.hintBy(day) : r.hintLate(day);
}

function RsvpForm({ event, guest, isPublic, onGuestChange, demo }) {
  const r = useCardText().rsvp;
  const existing = guest?.rsvp;
  const [status, setStatus] = useState(existing?.status ?? 'attending');
  const [count, setCount] = useState(existing?.count || 1);
  // How many of them eat vegetarian; the counter shows once asked for
  const [vegetarian, setVegetarian] = useState(existing?.vegetarian || 0);
  const [askVegetarian, setAskVegetarian] = useState((existing?.vegetarian || 0) > 0);
  const [note, setNote] = useState(existing?.note ?? '');
  const [song, setSong] = useState(existing?.song ?? '');
  // The bus they take, if the hosts laid some on; seats are counted from
  // the answer the card loaded with (theirs is in the bus's count)
  const shuttles = event.shuttles ?? [];
  const [loaded] = useState(() => ({ rsvp: existing }));
  const [shuttle, setShuttle] = useState(() => (guestShuttle(event, guest) ? existing.shuttle : ''));
  const chosenBus = shuttles.find(s => String(s._id) === shuttle);
  const busShort = status === 'attending' && chosenBus ? seatsLeft(chosenBus, loaded) < (Number(count) || 1) : false;
  const [name, setName] = useState(guest?.name ?? '');
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(!existing);
  // Last answer sent from this form; keeps the answered view even when the
  // parent holds no guest (demo, preview).
  const [answered, setAnswered] = useState(null);
  const current = answered ?? existing;

  async function submit(e) {
    e.preventDefault();
    if (isPublic && !guest?._id && !name.trim()) {
      toast.error(r.nameNeeded);
      return;
    }
    setIsSending(true);
    const people = status === 'declined' ? 1 : Number(count) || 1;
    const payload = {
      status,
      count: people,
      vegetarian: status === 'declined' ? 0 : Math.min(vegetarian, people),
      note,
      song: status === 'declined' ? '' : song.trim(),
      shuttle: status === 'attending' ? shuttle : '',
    };
    try {
      let res;
      if (demo) {
        res = {
          guestId: 'demo',
          rsvp: {
            ...payload,
            count: status === 'declined' ? 0 : payload.count,
            vegetarian: payload.vegetarian || undefined,
            song: payload.song || undefined,
            shuttle: payload.shuttle || undefined,
          },
        };
      } else if (guest?._id) {
        res = await invitationApi.rsvp(guest._id, payload);
      } else {
        res = await invitationApi.rsvpPublic(event._id, { ...payload, name: name.trim() });
        savePublicGuest(event._id, { _id: res.guestId, name: name.trim() });
      }
      onGuestChange?.({ ...(guest ?? {}), _id: res.guestId ?? guest._id, name: guest?.name ?? name.trim(), rsvp: res.rsvp });
      track('rsvp_submitted', { status, public: Boolean(isPublic), demo });
      if (status === 'attending') {
        burst();
      }
      toast.success(demo ? r.demoSent : (status === 'declined' ? r.sentDeclined : r.sentAttending));
      setAnswered(res.rsvp);
      setIsEditing(false);
    } catch (err) {
      console.log(err);
    } finally {
      setIsSending(false);
    }
  }

  if (!isEditing && current) {
    return (
      <div className={styles.card}>
        <h2 className={styles.h2}>{r.answeredTitle}</h2>
        <p className={styles.answered}>
          <IoCheckmarkCircle /> {r.answered} <strong>{r.labels[current.status]}</strong>
          {current.status !== 'declined' && (current.count > 1 || current.vegetarian > 0)
            ? ` (${[current.count > 1 && r.people(current.count), current.vegetarian > 0 && r.vegetarian(current.vegetarian)].filter(Boolean).join(', ')})`
            : ''}
        </p>
        {current.song && current.status !== 'declined' && (
          <p className={styles.songChosen}><IoMusicalNotes aria-hidden /> {r.song} <strong>{current.song}</strong></p>
        )}
        {(() => {
          const bus = guestShuttle(event, { rsvp: current });
          return bus && (
            <p className={styles.songChosen}><IoBusOutline aria-hidden /> {r.onBus} <strong>{bus.label}</strong> · {shuttleWhen(bus)}</p>
          );
        })()}
        <Button size="small" className={styles.textButton} onClick={() => setIsEditing(true)}>{r.change}</Button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.h2}>{r.title}</h2>
      <p className={styles.cardSub}>{answerHint(event, r)}</p>
      <form className={styles.form} onSubmit={submit}>
        {isPublic && !guest?._id && (
          <TextField size="small" label={r.yourName} value={name} inputProps={{ maxLength: 50 }} onChange={e => setName(e.target.value)} />
        )}
        <div className={styles.choices} role="radiogroup" aria-label={r.title}>
          {[['attending', '🥂'], ['maybe', '🤔'], ['declined', '💌']].map(([value, icon]) => (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={status === value}
              aria-label={r.labels[value]}
              className={clsx(styles.choice, status === value && styles.chosen)}
              onClick={() => setStatus(value)}
            >
              <span aria-hidden>{icon}</span>
              {r.choices[value]}
            </button>
          ))}
        </div>
        {status !== 'declined' && (
          <div className={styles.counter}>
            <span>{r.howMany}</span>
            <button
              type="button"
              aria-label={r.fewer}
              onClick={() => {
                const next = Math.max(1, Number(count) - 1);
                setCount(next);
                setVegetarian(v => Math.min(v, next));
              }}
            >
              −
            </button>
            <strong aria-live="polite">{count}</strong>
            <button type="button" aria-label={r.more} onClick={() => setCount(c => Math.min(20, Number(c) + 1))}>+</button>
          </div>
        )}
        {status !== 'declined' && (askVegetarian ? (
          <div className={styles.counter}>
            <span>{r.vegetarianCount}</span>
            <button type="button" aria-label={r.fewerVegetarian} onClick={() => setVegetarian(v => Math.max(0, v - 1))}>−</button>
            <strong aria-live="polite">{vegetarian}</strong>
            <button type="button" aria-label={r.moreVegetarian} onClick={() => setVegetarian(v => Math.min(Number(count) || 1, v + 1))}>+</button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.askVegetarian}
            onClick={() => {
              setAskVegetarian(true);
              setVegetarian(1);
            }}
          >
            {r.askVegetarian}
          </button>
        ))}
        {status === 'attending' && shuttles.length > 0 && (
          <fieldset className={styles.shuttles}>
            <legend>{r.shuttleTitle}</legend>
            <label className={clsx(styles.shuttle, !shuttle && styles.shuttleOn)}>
              <input type="radio" name="shuttle" value="" checked={!shuttle} onChange={() => setShuttle('')} />
              <span className={styles.shuttleText}><strong>{r.ownWay}</strong></span>
            </label>
            {shuttles.map(s => {
              const id = String(s._id);
              const left = seatsLeft(s, loaded);
              const full = left < (Number(count) || 1);
              return (
                <label key={id} className={clsx(styles.shuttle, shuttle === id && styles.shuttleOn, full && shuttle !== id && styles.full)}>
                  <input
                    type="radio"
                    name="shuttle"
                    value={id}
                    checked={shuttle === id}
                    disabled={full && shuttle !== id}
                    onChange={() => setShuttle(id)}
                  />
                  <span className={styles.shuttleText}>
                    <strong>{s.label}</strong>
                    <small>{shuttleWhen(s)}</small>
                  </span>
                  <em>{left === 0 ? r.busFull : r.seatsLeft(left)}</em>
                </label>
              );
            })}
            {busShort && <p className={styles.shuttleWarn} role="alert">{r.notEnough(seatsLeft(chosenBus, loaded))}</p>}
          </fieldset>
        )}
        {status !== 'declined' && (
          <TextField
            size="small"
            label={r.songLabel}
            placeholder={r.songPlaceholder}
            value={song}
            inputProps={{ maxLength: MAX_SONG }}
            onChange={e => setSong(e.target.value)}
          />
        )}
        <TextField size="small" label={r.note} value={note} inputProps={{ maxLength: 300 }} onChange={e => setNote(e.target.value)} />
        <LoadingButton type="submit" variant="contained" size="large" loading={isSending} disabled={busShort}>{r.send}</LoadingButton>
      </form>
    </div>
  );
}

function WishesWall({ event, guest, isPublic, wishes, onPosted, demo }) {
  const w = useCardText().wishes;
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
      toast.error(w.nameNeeded);
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
      <h2 className={styles.h2}>{w.title}</h2>
      <p className={styles.cardSub}>{w.sub}</p>
      <form className={clsx(styles.card, styles.form)} onSubmit={submit}>
        {(isPublic || demo) && (
          <TextField size="small" label={w.yourName} value={name} inputProps={{ maxLength: 50 }} onChange={e => setName(e.target.value)} />
        )}
        <TextField
          multiline
          minRows={2}
          label={w.label}
          value={message}
          inputProps={{ maxLength: 500 }}
          onChange={e => setMessage(e.target.value)}
        />
        <LoadingButton type="submit" variant="contained" loading={isSending} startIcon={<IoSend />} disabled={!message.trim()}>
          {w.send}
        </LoadingButton>
      </form>
      {wishes.length > 0 && (
        <ul className={styles.wishes}>
          {wishes.map((wish, i) => (
            <li key={wish._id} style={{ '--tilt': `${((i * 37) % 7) - 3}deg` }}>
              <p>{wish.message}</p>
              <span>— {wish.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
