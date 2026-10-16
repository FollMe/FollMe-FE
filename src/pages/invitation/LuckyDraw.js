import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import {
  IoArrowBack, IoClose, IoExpandOutline, IoContractOutline, IoSettingsOutline, IoGiftOutline, IoRefresh,
} from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { eventHeadline, invitationApi, isCoupleEvent } from 'util/invitation';
import { MAX_NUMBER, POOLS, drawWinner, loadWinners, poolEntries, reel, saveWinners } from 'util/luckyDraw';
import { burst } from 'util/confetti';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './LuckyDraw.module.scss';

const PRIZES = ['Giải khuyến khích', 'Giải ba', 'Giải nhì', 'Giải nhất', 'Giải đặc biệt'];
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * "Quay số may mắn" for the projector at the party: names flash by and
 * slow down on the winner. Space or the button draws; winners are kept on
 * this device and not drawn again unless asked.
 */
export default function LuckyDraw() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [failed, setFailed] = useState(false);
  const [pool, setPool] = useState('arrived');
  const [numbers, setNumbers] = useState(100);
  const [custom, setCustom] = useState('');
  const [prize, setPrize] = useState(PRIZES[0]);
  const [once, setOnce] = useState(true);
  const [winners, setWinners] = useState(() => loadWinners(eventId));
  const [shown, setShown] = useState(null);
  const [phase, setPhase] = useState('ready'); // ready | spinning | won
  const [isSetupOpen, setIsSetupOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Quay số may mắn · ${eventHeadline(invitation)}` });
        setEvent(invitation);
        // Start with the pool that has people in it on the day
        const firstWithPeople = ['arrived', 'attending', 'wishes'].find(p => poolEntries(invitation, p).length > 0);
        setPool(firstWithPeople ?? 'numbers');
      })
      .catch(() => setFailed(true));
    return () => clearTimeout(timer.current);
  }, [eventId]);

  useEffect(() => saveWinners(eventId, winners), [eventId, winners]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const entries = useMemo(() => poolEntries(event, pool, { numbers, custom }), [event, pool, numbers, custom]);
  const left = once ? entries.filter(e => !winners.some(w => w.id === e.id)).length : entries.length;

  const draw = useCallback(() => {
    if (phase === 'spinning') {
      return;
    }
    const winner = drawWinner(entries, winners, { once });
    if (!winner) {
      return;
    }
    setIsSetupOpen(false);
    const land = () => {
      setShown(winner);
      setPhase('won');
      setWinners(list => [{ ...winner, prize: prize.trim(), at: new Date().toISOString() }, ...list]);
      burst({ count: 160, colors: ['#d9b66b', '#f6e3b4', '#c45c74', '#ffffff', '#e8a3b0'] });
      track('lucky_draw', { pool, size: entries.length });
    };
    if (reducedMotion()) {
      land();
      return;
    }
    setPhase('spinning');
    const { names, delays } = reel(entries, winner, Math.min(32, Math.max(14, entries.length * 2)));
    let i = 0;
    const step = () => {
      if (i === names.length - 1) {
        land();
        return;
      }
      setShown(names[i]);
      timer.current = setTimeout(step, delays[i]);
      i += 1;
    };
    step();
  }, [entries, winners, once, prize, pool, phase]);

  // Space or Enter draws, unless typing in the settings
  useEffect(() => {
    function onKey(e) {
      if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('input, textarea, [role="listbox"], button, [role="button"]')) {
        e.preventDefault();
        draw();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw]);

  function removeWinner(index) {
    setWinners(list => list.filter((_, i) => i !== index));
  }

  function resetWinners() {
    if (window.confirm('Xoá danh sách người trúng? Họ sẽ có thể được quay lại.')) {
      setWinners([]);
      setShown(null);
      setPhase('ready');
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  if (failed) {
    return (
      <div className={styles.message}>
        <p>Không mở được trang quay số. Hãy đăng nhập bằng tài khoản quản lý thiệp rồi thử lại.</p>
        <Button component={Link} to="/sign-in" variant="contained">Đăng nhập</Button>
      </div>
    );
  }
  if (!event) {
    return <OvalLoading />;
  }

  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  const poolLabel = POOLS.find(p => p.value === pool)?.label;
  return (
    <div className={clsx(styles.screen, styles[event.theme] ?? styles.classic)}>
      <header className={styles.top}>
        <Button component={Link} to={`/events/${eventId}`} size="small" startIcon={<IoArrowBack />} className={styles.chrome}>
          Thiệp
        </Button>
        <p className={styles.couple}>
          {couple ? <>{event.groomName} <span>&amp;</span> {event.brideName}</> : event.title}
        </p>
        <div className={styles.topActions}>
          <Button
            size="small"
            className={styles.chrome}
            startIcon={<IoSettingsOutline />}
            onClick={() => setIsSetupOpen(open => !open)}
            aria-expanded={isSetupOpen}
            aria-controls="draw-setup"
          >
            Cài đặt
          </Button>
          <Button
            size="small"
            className={styles.chrome}
            startIcon={isFullscreen ? <IoContractOutline /> : <IoExpandOutline />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          </Button>
        </div>
      </header>

      <section className={styles.stage} aria-labelledby="draw-title">
        <h1 id="draw-title" className={styles.title}>Quay số may mắn</h1>
        {prize.trim() && <p className={styles.prize}><IoGiftOutline aria-hidden /> {prize.trim()}</p>}
        <div className={clsx(styles.reel, phase === 'spinning' && styles.spinning, phase === 'won' && styles.won)}>
          {shown ? (
            <>
              <span className={clsx(styles.name, shown.name.length > 22 && styles.long)}>{shown.name}</span>
              {shown.note && <span className={styles.note}>{shown.note}</span>}
            </>
          ) : (
            <span className={styles.placeholder}>{entries.length ? '?' : 'Chưa có ai để quay'}</span>
          )}
        </div>
        <p className={styles.srOnly} aria-live="polite">
          {phase === 'won' && shown ? `${prize.trim() || 'Người trúng'}: ${shown.name}` : ''}
        </p>
        <button
          type="button"
          className={styles.drawButton}
          onClick={draw}
          disabled={phase === 'spinning' || left === 0}
        >
          {phase === 'spinning' ? 'Đang quay…' : phase === 'won' ? 'Quay tiếp' : 'Quay'}
        </button>
        <p className={styles.hint}>
          {left === 0 && entries.length > 0
            ? 'Ai cũng đã trúng rồi! Bật "Cho trúng nhiều lần" hoặc đổi danh sách.'
            : `${left} người trong lượt quay · ${poolLabel} · Phím cách để quay`}
        </p>
      </section>

      {winners.length > 0 && (
        <aside className={styles.winners} aria-labelledby="winners-title">
          <h2 id="winners-title">Đã trúng <span>{winners.length}</span></h2>
          <ol>
            {winners.map((w, i) => (
              <li key={`${w.id}-${w.at}`}>
                <span className={styles.winnerText}>
                  <strong>{w.name}</strong>
                  {(w.prize || w.note) && <span>{[w.prize, w.note].filter(Boolean).join(' · ')}</span>}
                </span>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeWinner(i)}
                  aria-label={`Bỏ ${w.name} khỏi danh sách trúng (vắng mặt, quay lại)`}
                  title="Vắng mặt? Bỏ ra để quay lại"
                >
                  <IoClose />
                </button>
              </li>
            ))}
          </ol>
        </aside>
      )}

      {isSetupOpen && (
        <section id="draw-setup" className={styles.setup} aria-label="Cài đặt quay số">
          <div className={styles.setupHead}>
            <h2>Cài đặt</h2>
            <button type="button" className={styles.remove} onClick={() => setIsSetupOpen(false)} aria-label="Đóng cài đặt">
              <IoClose />
            </button>
          </div>
          <TextField select size="small" label="Quay trong" value={pool} onChange={e => setPool(e.target.value)} fullWidth>
            {POOLS.map(p => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
                {!['numbers', 'custom'].includes(p.value) && ` (${poolEntries(event, p.value).length})`}
              </MenuItem>
            ))}
          </TextField>
          {pool === 'numbers' && (
            <TextField
              size="small"
              type="number"
              label="Số phiếu đã phát"
              value={numbers}
              inputProps={{ min: 1, max: MAX_NUMBER }}
              onChange={e => setNumbers(e.target.value)}
              helperText="Khách cầm phiếu số từ 1 đến số này"
              fullWidth
            />
          )}
          {pool === 'custom' && (
            <TextField
              label="Mỗi dòng một tên"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              multiline
              minRows={4}
              maxRows={10}
              helperText={`${entries.length} tên`}
              fullWidth
            />
          )}
          {pool === 'arrived' && entries.length === 0 && (
            <p className={styles.setupHint}>Chưa ai được đánh dấu đã đến. Dùng trang đón khách, hoặc chọn danh sách khác.</p>
          )}
          <div>
            <TextField size="small" label="Tên giải" value={prize} inputProps={{ maxLength: 40 }} onChange={e => setPrize(e.target.value)} fullWidth />
            <div className={styles.quick} role="group" aria-label="Giải gợi ý">
              {PRIZES.map(name => (
                <button key={name} type="button" aria-pressed={prize === name} onClick={() => setPrize(name)}>{name}</button>
              ))}
            </div>
          </div>
          <FormControlLabel
            control={<Switch checked={!once} onChange={e => setOnce(!e.target.checked)} />}
            label="Cho trúng nhiều lần"
          />
          {winners.length > 0 && (
            <Button size="small" color="inherit" startIcon={<IoRefresh />} onClick={resetWinners}>
              Xoá danh sách đã trúng
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
