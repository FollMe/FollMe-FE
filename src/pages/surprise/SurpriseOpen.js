import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { IoEyeOutline, IoEyeOffOutline, IoMusicalNotes, IoVolumeMuteOutline } from 'react-icons/io5';
import GiftScene from 'components/surprise/GiftScene';
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
const CHAMPAGNE = ['#f6e4b8', '#e3c288', '#c9a063', '#fff7e6', '#d9879f'];

/** Slim candles on a glass ledge: tap each to blow it out. */
function Candles({ lit, onBlow }) {
  return (
    <div className={styles.candles}>
      {lit.map((on, i) => (
        <button
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          type="button"
          className={clsx(styles.candle, !on && styles.out)}
          style={{ '--i': i }}
          onClick={() => onBlow(i)}
          disabled={!on}
          aria-label={on ? `Thổi ngọn nến ${i + 1}` : `Nến ${i + 1} đã tắt`}
        >
          <span className={styles.halo} aria-hidden />
          <span className={styles.flame} aria-hidden />
          <span className={styles.smoke} aria-hidden />
          <span className={styles.wax} aria-hidden />
        </button>
      ))}
      <span className={styles.ledge} aria-hidden />
    </div>
  );
}

/** A gift card that leans toward the finger or the mouse. */
function GiftCard({ gift, index, onChoose }) {
  const ref = useRef(null);
  function lean(e) {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
    el.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 14}deg`);
  }
  function rest() {
    ref.current.style.setProperty('--ry', '0deg');
    ref.current.style.setProperty('--rx', '0deg');
  }
  return (
    <li style={{ '--i': index }}>
      <button ref={ref} type="button" className={styles.gift} onClick={() => onChoose(gift)} onPointerMove={lean} onPointerLeave={rest}>
        <span className={styles.medal} aria-hidden>{gift.emoji || '🎁'}</span>
        <strong>{gift.title}</strong>
        {gift.note && <span className={styles.giftNote}>{gift.note}</span>}
      </button>
    </li>
  );
}

/**
 * "Hộp quà bí mật" (/qua/:id): the birthday surprise. A gift box on a 3D
 * stage, a mascot that covers its eyes while she types the password, then
 * candles to blow (the box opens), the letter, and the gifts to pick one from.
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

  useEffect(() => {
    if (chosen) {
      pickRef.current?.focus();
    }
  }, [chosen]);

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
      // The lid lifts in the scene; gold falls a moment later
      setTimeout(() => burst({ colors: CHAMPAGNE, y: window.innerHeight * 0.3 }), 500);
      setTimeout(() => burst({ colors: CHAMPAGNE, x: window.innerWidth * 0.25, y: window.innerHeight * 0.35, count: 50 }), 750);
      setTimeout(() => burst({ colors: CHAMPAGNE, x: window.innerWidth * 0.75, y: window.innerHeight * 0.35, count: 50 }), 900);
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      burst({ colors: CHAMPAGNE });
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

  function goTo(next) {
    setStage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- What the mascot does, and the line under the stage ----------
  const candlesOut = lit.every(on => !on);
  let mood = 'idle';
  let say = '';
  if (stage === 'sleep') {
    mood = 'sleep';
    say = `${friend.hello} đang canh hộp quà. Chưa tới giờ mở đâu nhé.`;
  } else if (stage === 'lock') {
    if (reaction === 'sad') {
      mood = 'sad';
      say = 'Chưa đúng rồi. Thử lại nhé.';
    } else if (reaction === 'tired') {
      mood = 'sleep';
      say = 'Thử nhiều quá rồi. Nghỉ một chút rồi thử lại nhé.';
    } else if (isTyping && password && showPassword) {
      mood = 'peek';
      say = `Ơ, ${friend.hello} thấy rồi nhé.`;
    } else if (isTyping && password) {
      mood = 'cover';
      say = `${friend.hello} không nhìn đâu.`;
    } else {
      say = 'Nhập mật khẩu để mở hộp quà.';
    }
  } else if (stage === 'cake') {
    mood = candlesOut ? 'happy' : 'idle';
    say = candlesOut ? `Chúc ${name} sinh nhật thật hạnh phúc.` : 'Nhắm mắt, ước một điều, rồi chạm để thổi nến.';
  } else if (stage === 'letter') {
    mood = 'love';
    say = `Một lá thư từ ${from}.`;
  } else if (stage === 'gifts') {
    mood = 'love';
    say = `Món nào cũng được chọn riêng cho ${name}.`;
  } else if (stage === 'done') {
    mood = 'happy';
    say = `Đã gửi lựa chọn đến ${from}.`;
  } else if (stage === 'missing') {
    mood = 'sad';
    say = 'Hộp quà này không còn nữa.';
  } else if (stage === 'offline') {
    mood = 'sad';
    say = 'Mạng đang chập chờn. Thử lại sau một chút nhé.';
  }

  if (stage === 'loading') {
    return (
      <main className={styles.page} data-stage="loading">
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden />
          Đang mở hộp quà…
        </div>
      </main>
    );
  }

  const left = untilOpen(view?.opensAt, now);
  const pick = data?.pick;
  const opened = (stage === 'cake' && candlesOut) || stage === 'letter' || stage === 'gifts' || stage === 'done';
  const heading = {
    lock: ['Một món quà dành riêng cho', name],
    sleep: ['Sắp tới rồi', name],
    cake: ['Happy Birthday', name],
    done: ['Happy Birthday', name],
  }[stage];

  return (
    <main className={styles.page} data-stage={stage}>
      <div className={styles.glow} aria-hidden />
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

      <section className={styles.content}>
        {heading && (
          <header className={styles.heading}>
            <p className={styles.eyebrow}>{heading[0]}</p>
            <h1>{heading[1]}</h1>
          </header>
        )}

        <div className={styles.stage}>
          <GiftScene kind={kind} mood={mood} opened={opened} label={`${friend.label}: ${say}`} />
        </div>
        <p className={styles.caption} role="status" aria-live="polite">{say}</p>

        {stage === 'sleep' && left && (
          <div className={styles.countdown}>
            <p>Mở lúc {dayjs(vnWallClock(view.opensAt)).format('HH:mm, DD/MM/YYYY')}</p>
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
              {busy ? 'Đang mở…' : 'Mở quà'}
            </button>
            <p className={styles.small}>Không phân biệt chữ hoa, dấu hay khoảng trắng.</p>
          </form>
        )}

        {stage === 'cake' && (
          <div className={styles.wish}>
            <Candles lit={lit} onBlow={blow} />
            {candlesOut && (
              <button type="button" className={styles.primary} onClick={() => goTo('letter')}>Đọc thư</button>
            )}
          </div>
        )}

        {(stage === 'letter' || rereading) && data && (
          <article className={styles.letter} aria-labelledby="surprise-letter">
            <p className={styles.letterMark}>Thư tay</p>
            <h2 id="surprise-letter">Gửi {data.recipientName},</h2>
            {data.message && <p className={styles.message}>{data.message}</p>}
            {data.fromName && <p className={styles.signature}>{data.fromName}</p>}
            {stage === 'letter' ? (
              <button type="button" className={styles.ink} onClick={() => goTo('gifts')}>Xem quà</button>
            ) : (
              <button type="button" className={styles.inkGhost} onClick={() => setRereading(false)}>Đóng thư</button>
            )}
          </article>
        )}

        {stage === 'gifts' && data && (
          <div className={styles.giftArea}>
            <h2 className={styles.sectionTitle}>Chọn một món quà</h2>
            <ul className={styles.gifts}>
              {data.gifts.map((gift, i) => (
                <GiftCard key={gift._id} gift={gift} index={i} onChoose={g => { setChosen(g); setNote(''); }} />
              ))}
            </ul>
          </div>
        )}

        {stage === 'done' && pick && !rereading && (
          <div className={clsx(styles.card, styles.done)}>
            <span className={styles.medal} aria-hidden>{pick.emoji || '🎁'}</span>
            <p className={styles.eyebrow}>{name} đã chọn</p>
            <h2>{pick.title}</h2>
            {pick.note && <p className={styles.doneNote}>“{pick.note}”</p>}
            <p className={styles.small}>Gửi lúc {dayjs(vnWallClock(pick.at)).format('HH:mm, DD/MM')}</p>
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
            <span className={styles.medal} aria-hidden>{chosen.emoji || '🎁'}</span>
            <h2 id="surprise-confirm">Chọn “{chosen.title}”?</h2>
            <label htmlFor="surprise-note">Nhắn {from} vài lời (không bắt buộc)</label>
            <textarea
              id="surprise-note"
              ref={pickRef}
              value={note}
              rows={2}
              maxLength={MAX_PICK_NOTE}
              onChange={e => setNote(e.target.value)}
              placeholder="Cảm ơn anh, thương lắm."
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
