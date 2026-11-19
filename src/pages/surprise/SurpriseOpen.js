import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { IoEyeOutline, IoEyeOffOutline, IoMusicalNotes, IoVolumeMuteOutline } from 'react-icons/io5';
import Mascot from 'components/surprise/Mascot';
import { burst } from 'util/confetti';
import { MusicBox, canPlayMusic } from 'util/musicBox';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import {
  MAX_PICK_NOTE, mascotOf, recallPassword, rememberPassword, surpriseApi, untilOpen,
} from 'util/surprise';
import styles from './SurpriseOpen.module.scss';

const CANDLES = 3;
const PARTY = ['#ff6b8b', '#ffd166', '#8fd3ff', '#b28dff', '#7ee0b0', '#ffffff'];

function Bubble({ children }) {
  return (
    <p className={styles.bubble} role="status" aria-live="polite">
      {children}
    </p>
  );
}

/** Balloons drifting up behind everything. */
function Balloons() {
  return (
    <div className={styles.balloons} aria-hidden>
      {['#ff8fab', '#ffd166', '#8fd3ff', '#b28dff', '#7ee0b0', '#ff6b8b'].map((color, i) => (
        <span key={color} style={{ '--c': color, '--i': i }} />
      ))}
    </div>
  );
}

/** A cake: tap each candle to blow it out. */
function Cake({ lit, onBlow }) {
  return (
    <div className={styles.cake}>
      <div className={styles.candles}>
        {lit.map((on, i) => (
          <button
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            type="button"
            className={clsx(styles.candle, !on && styles.out)}
            onClick={() => onBlow(i)}
            disabled={!on}
            aria-label={on ? `Thổi ngọn nến ${i + 1}` : `Nến ${i + 1} đã tắt`}
          >
            <span className={styles.flame} aria-hidden />
            <span className={styles.smoke} aria-hidden />
          </button>
        ))}
      </div>
      <div className={styles.cakeTop} aria-hidden />
      <div className={styles.cakeBody} aria-hidden>
        <span /><span /><span />
      </div>
      <div className={styles.plate} aria-hidden />
    </div>
  );
}

/**
 * "Hộp quà bí mật" (/qua/:id): the birthday surprise. A mascot asks for
 * the password (covering its eyes as she types), then candles to blow,
 * the letter, and the gifts to pick one from.
 */
export default function SurpriseOpen() {
  const { id } = useParams();
  const [view, setView] = useState(null);
  const [stage, setStage] = useState('loading'); // loading | missing | offline | sleep | lock | cake | letter | gifts | done
  const [data, setData] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [reaction, setReaction] = useState(null); // null | 'sad' | 'happy' | 'tired'
  const [busy, setBusy] = useState(false);
  const [lit, setLit] = useState(() => Array(CANDLES).fill(true));
  const [chosen, setChosen] = useState(null);
  const [note, setNote] = useState('');
  const [rereading, setRereading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const music = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const pickRef = useRef(null);

  const kind = view?.mascot ?? data?.mascot ?? 'bear';
  const friend = mascotOf(kind);
  const name = view?.recipientName ?? data?.recipientName ?? '';
  const from = data?.fromName || 'anh ấy';

  const open = useCallback(async secret => {
    const res = await surpriseApi.unlock(id, secret);
    rememberPassword(id, secret);
    setData(res);
    setStage(res.pick ? 'done' : 'cake');
    return res;
  }, [id]);

  // What the link shows before the password; straight in when this tab already opened it
  useEffect(() => {
    let isActive = true;
    surpriseApi.publicView(id)
      .then(async res => {
        if (!isActive) {
          return;
        }
        setView(res);
        setPageMeta({ title: `Một món quà cho ${res.recipientName} 🎁` });
        if (!res.isOpen) {
          setStage('sleep');
          return;
        }
        const saved = recallPassword(id);
        if (saved) {
          setPassword(saved);
          try {
            await open(saved);
            return;
          } catch (err) {
            // Changed meanwhile: ask again
          }
        }
        setStage('lock');
      })
      .catch(err => isActive && setStage(err?.status === 404 || err?.status === 400 ? 'missing' : 'offline'));
    return () => {
      isActive = false;
    };
  }, [id, open]);

  // The countdown while it sleeps; it wakes up on its own
  useEffect(() => {
    if (stage !== 'sleep') {
      return undefined;
    }
    const timer = setInterval(() => {
      setNow(Date.now());
      if (!untilOpen(view?.opensAt)) {
        setView(v => ({ ...v, isOpen: true }));
        setStage('lock');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, view]);

  useEffect(() => () => music.current?.close(), []);

  useEffect(() => {
    if (!reaction || reaction === 'happy') {
      return undefined;
    }
    const timer = setTimeout(() => setReaction(null), 1800);
    return () => clearTimeout(timer);
  }, [reaction, password]);

  function startMusic() {
    if (!canPlayMusic()) {
      return;
    }
    try {
      // Made inside the tap: browsers only let sound start from one
      music.current = music.current ?? new MusicBox({ song: 'birthday' });
      music.current.ctx.resume();
    } catch (err) {
      music.current = null;
    }
  }

  function toggleMusic() {
    if (!music.current) {
      startMusic();
    }
    if (!music.current) {
      return;
    }
    if (isPlaying) {
      music.current.pause();
      setIsPlaying(false);
    } else {
      music.current.play();
      setIsPlaying(true);
    }
  }

  async function unlock(e) {
    e.preventDefault();
    if (!password.trim() || busy) {
      return;
    }
    startMusic();
    setBusy(true);
    try {
      await open(password);
      setReaction('happy');
      burst({ colors: PARTY });
      navigator.vibrate?.(40);
      track('surprise_unlocked');
    } catch (err) {
      setReaction(err?.status === 429 ? 'tired' : 'sad');
      navigator.vibrate?.([60, 40, 60]);
    } finally {
      setBusy(false);
    }
  }

  function blow(i) {
    const next = lit.map((on, k) => (k === i ? false : on));
    setLit(next);
    if (next.every(on => !on)) {
      burst({ colors: PARTY });
      setTimeout(() => burst({ colors: PARTY, x: window.innerWidth * 0.2, y: window.innerHeight * 0.4 }), 250);
      setTimeout(() => burst({ colors: PARTY, x: window.innerWidth * 0.8, y: window.innerHeight * 0.4 }), 450);
      if (music.current && !isPlaying) {
        music.current.play();
        setIsPlaying(true);
      }
      track('surprise_candles');
    }
  }

  async function confirmPick(e) {
    e.preventDefault();
    if (!chosen || busy) {
      return;
    }
    setBusy(true);
    try {
      const res = await surpriseApi.pick(id, { password, giftId: chosen._id, note: note.trim() || undefined });
      setData(d => ({ ...d, pick: res.pick }));
      setChosen(null);
      setStage('done');
      burst({ colors: PARTY });
      setTimeout(() => burst({ colors: PARTY }), 400);
      track('surprise_picked');
    } catch (err) {
      if (err?.status === 409) {
        // Picked on another phone meanwhile
        await open(password).catch(() => {});
        setChosen(null);
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (chosen) {
      pickRef.current?.focus();
    }
  }, [chosen]);

  // ---------- What the mascot does and says ----------
  let mood = 'idle';
  let say = '';
  if (stage === 'sleep') {
    mood = 'sleep';
    say = `Suỵt… ${friend.hello} đang canh hộp quà. Chưa tới ngày đâu nha!`;
  } else if (stage === 'lock') {
    if (reaction === 'sad') {
      mood = 'sad';
      say = 'Hông đúng rồi 🥺 Thử lại nha!';
    } else if (reaction === 'tired') {
      mood = 'sleep';
      say = 'Thử nhiều quá rồi, nghỉ xíu rồi thử lại nha 😴';
    } else if (isTyping && password && showPassword) {
      mood = 'peek';
      say = `Ơ, ${friend.hello} thấy rồi nha 👀`;
    } else if (isTyping && password) {
      mood = 'cover';
      say = `${friend.hello} không nhìn đâu 🙈`;
    } else {
      say = `${name} ơi! 💕 Có một món quà đang chờ ${name} đó. Nhập mật khẩu để mở nha!`;
    }
  } else if (stage === 'cake') {
    mood = lit.every(on => !on) ? 'love' : 'happy';
    say = lit.every(on => !on)
      ? `Chúc mừng sinh nhật ${name}! 🎉`
      : 'Nhắm mắt ước một điều, rồi chạm vào từng ngọn nến để thổi nha 🕯️';
  } else if (stage === 'letter') {
    mood = 'love';
    say = `${data?.fromName ? `${data.fromName} gửi` : 'Có'} thư cho ${name} nè 💌`;
  } else if (stage === 'gifts') {
    mood = 'happy';
    say = `Chọn một món ${name} thích nhất nha 🎁`;
  } else if (stage === 'done') {
    mood = 'gift';
    say = `Yay! ${from[0].toUpperCase()}${from.slice(1)} biết rồi nha 💝`;
  } else if (stage === 'missing') {
    mood = 'sad';
    say = 'Hộp quà này không còn nữa rồi 🥺';
  } else if (stage === 'offline') {
    mood = 'sad';
    say = 'Mạng chập chờn rồi, thử lại sau xíu nha';
  }

  if (stage === 'loading') {
    return (
      <main className={styles.page}>
        <div className={styles.center}><Mascot kind="bear" mood="idle" size={150} label="Đang mở hộp quà" /></div>
      </main>
    );
  }

  const left = untilOpen(view?.opensAt, now);
  const pick = data?.pick;

  return (
    <main className={styles.page} data-stage={stage}>
      <Balloons />
      {data && canPlayMusic() && (
        <button
          type="button"
          className={styles.music}
          onClick={toggleMusic}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc chúc mừng sinh nhật'}
        >
          {isPlaying ? <IoMusicalNotes /> : <IoVolumeMuteOutline />}
        </button>
      )}

      <section className={styles.scene}>
        {(stage === 'cake' || stage === 'done') && <h1 className={styles.title}>Happy Birthday<span>{name}</span></h1>}
        {stage === 'lock' && <h1 className={styles.title}>Một món quà<span>cho {name}</span></h1>}
        {stage === 'sleep' && <h1 className={styles.title}>Sắp tới rồi<span>{name} ơi</span></h1>}

        <Bubble>{say}</Bubble>
        <Mascot kind={kind} mood={mood} size={stage === 'gifts' || stage === 'letter' ? 150 : 200} label={`${friend.label}: ${say}`} className={styles.mascot} />

        {stage === 'sleep' && left && (
          <div className={styles.countdown}>
            <p>Hộp quà mở lúc {dayjs(vnWallClock(view.opensAt)).format('HH:mm, DD/MM/YYYY')}</p>
            <div aria-label="Đếm ngược">
              {[['days', 'ngày'], ['hours', 'giờ'], ['minutes', 'phút'], ['seconds', 'giây']].map(([k, label]) => (
                <span key={k}><strong>{String(left[k]).padStart(2, '0')}</strong>{label}</span>
              ))}
            </div>
          </div>
        )}

        {stage === 'lock' && (
          <form className={clsx(styles.card, styles.lock, reaction === 'sad' && styles.shake)} onSubmit={unlock}>
            <label htmlFor="surprise-password">Mật khẩu</label>
            <div className={styles.passwordRow}>
              <input
                id="surprise-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={reaction === 'sad'}
                aria-describedby={view?.hint ? 'surprise-hint' : undefined}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
              >
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>
            {view?.hint && <p id="surprise-hint" className={styles.hint}>Gợi ý: {view.hint}</p>}
            <button type="submit" className={styles.primary} disabled={busy || !password.trim()}>
              {busy ? 'Đang mở…' : 'Mở quà 🎁'}
            </button>
            <p className={styles.small}>Không cần viết hoa hay gõ dấu đâu nha</p>
          </form>
        )}

        {stage === 'cake' && (
          <div className={styles.cakeStage}>
            <Cake lit={lit} onBlow={blow} />
            {lit.every(on => !on) && (
              <button type="button" className={styles.primary} onClick={() => setStage('letter')}>Đọc thư nè 💌</button>
            )}
          </div>
        )}

        {(stage === 'letter' || rereading) && data && (
          <article className={clsx(styles.card, styles.letter)} aria-labelledby="surprise-letter">
            <h2 id="surprise-letter">Gửi {data.recipientName},</h2>
            {data.message && <p className={styles.message}>{data.message}</p>}
            {data.fromName && <p className={styles.signature}>— {data.fromName}</p>}
            {stage === 'letter' ? (
              <button type="button" className={styles.primary} onClick={() => setStage('gifts')}>Mở quà thôi 🎁</button>
            ) : (
              <button type="button" className={styles.secondary} onClick={() => setRereading(false)}>Đóng thư</button>
            )}
          </article>
        )}

        {stage === 'gifts' && data && (
          <div className={styles.giftArea}>
            <h2 className={styles.giftTitle}>Chọn một món quà nha</h2>
            <ul className={styles.gifts}>
              {data.gifts.map((gift, i) => (
                <li key={gift._id} style={{ '--i': i }}>
                  <button type="button" className={styles.gift} onClick={() => { setChosen(gift); setNote(''); }}>
                    <span className={styles.ribbon} aria-hidden />
                    <span className={styles.giftEmoji} aria-hidden>{gift.emoji || '🎁'}</span>
                    <strong>{gift.title}</strong>
                    {gift.note && <span className={styles.giftNote}>{gift.note}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === 'done' && pick && !rereading && (
          <div className={clsx(styles.card, styles.done)}>
            <span className={styles.doneEmoji} aria-hidden>{pick.emoji || '🎁'}</span>
            <p className={styles.doneLabel}>{name} đã chọn</p>
            <h2>{pick.title}</h2>
            {pick.note && <p className={styles.doneNote}>“{pick.note}”</p>}
            <p className={styles.small}>Đã báo cho {from} lúc {dayjs(vnWallClock(pick.at)).format('HH:mm DD/MM')} rồi nha</p>
            {data?.message && <button type="button" className={styles.secondary} onClick={() => setRereading(true)}>Đọc lại thư</button>}
          </div>
        )}

        {stage === 'offline' && (
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>Thử lại</button>
        )}
      </section>

      {chosen && (
        <div className={styles.sheetBackdrop} role="presentation" onClick={e => e.target === e.currentTarget && setChosen(null)}>
          <form className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="surprise-confirm" onSubmit={confirmPick}>
            <Mascot kind={kind} mood="love" size={96} label={friend.label} />
            <h2 id="surprise-confirm">Chọn {chosen.emoji || '🎁'} {chosen.title} nha?</h2>
            <label htmlFor="surprise-note">Nhắn {from} vài lời (không bắt buộc)</label>
            <textarea
              id="surprise-note"
              ref={pickRef}
              value={note}
              rows={2}
              maxLength={MAX_PICK_NOTE}
              onChange={e => setNote(e.target.value)}
              placeholder="Cảm ơn nha, thương lắm 💕"
            />
            <div className={styles.sheetActions}>
              <button type="button" className={styles.secondary} onClick={() => setChosen(null)}>Xem lại</button>
              <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Đang gửi…' : 'Chọn món này'}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
