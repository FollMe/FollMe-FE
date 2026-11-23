import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { prefersReducedMotion } from './usePlayer';
import styles from './Money.module.scss';

const MODES = [
  { key: 'same', label: 'Cùng bank' },
  { key: 'cross', label: 'Khác bank' },
];

/**
 * One 1M transfer from the wallet's account to the partner's. Same bank,
 * it is one book transfer. Cross-bank, a rail sits in the middle, and a
 * timeout there leaves money in no man's land until an inquiry answers.
 */
export default function TopologyDemo() {
  const [mode, setMode] = useState('same');
  const [timeout, setTimeoutMode] = useState(false);
  // idle → moving → middle (cross) → stuck (timeout) → done
  const [phase, setPhase] = useState('idle');
  const timers = useRef([]);
  const fast = prefersReducedMotion();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function clear() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function later(fn, ms) {
    timers.current.push(setTimeout(fn, fast ? 0 : ms));
  }

  function switchMode(key) {
    clear();
    setMode(key);
    setPhase('idle');
  }

  function send() {
    clear();
    setPhase('moving');
    if (mode === 'same') {
      later(() => setPhase('done'), 500);
      return;
    }
    later(() => setPhase('middle'), 900);
    later(() => setPhase(timeout ? 'stuck' : 'done'), 2600);
  }

  function inquire() {
    setPhase('inquiring');
    later(() => setPhase('done'), 1200);
  }

  const cross = mode === 'cross';
  const pos = phase === 'idle' ? 'a' : phase === 'done' || !cross ? 'b' : 'mid';

  const status = {
    idle: 'Chưa chuyển.',
    moving: cross ? 'Tiền đang rời bank A…' : 'Một bank, hai con số trong core của chính nó.',
    middle: 'Tiền đã rời bank A, đang đi qua rail.',
    stuck: 'Timeout. Tiền đã rời A nhưng chưa thấy tới B, và call không có câu trả lời. Đừng refund: hỏi lại.',
    inquiring: 'Inquiry trạng thái lệnh chuyển…',
    done: cross ? 'Đã tới bank B.' : 'Xong gần như tức thì, atomic trong core của bank.',
  }[phase];

  return (
    <div className={styles.topo}>
      <div className={styles.topoBar}>
        <div className={styles.seg} role="tablist" aria-label="Topology">
          {MODES.map(m => (
            <button key={m.key} type="button" role="tab" aria-selected={mode === m.key} className={clsx(mode === m.key && styles.segOn)} onClick={() => switchMode(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
        {cross && (
          <label className={styles.toggle}>
            <input type="checkbox" checked={timeout} onChange={e => setTimeoutMode(e.target.checked)} />
            <span>Giả lập timeout ở giữa</span>
          </label>
        )}
      </div>

      <div className={clsx(styles.track, cross && styles.trackCross)}>
        <div className={styles.acct}><strong>Wallet acct</strong><span>Bank A</span></div>
        {cross && <div className={clsx(styles.rail, (phase === 'stuck' || phase === 'inquiring') && styles.railWarn)}><strong>NAPAS 247 / Citad</strong><span>bên thứ ba</span></div>}
        <div className={styles.acct}><strong>Partner acct</strong><span>{cross ? 'Bank B' : 'Bank A'}</span></div>
        <span className={clsx(styles.coin, styles[`coin_${pos}`], cross && styles.coinCross, phase === 'stuck' && styles.coinStuck)} aria-hidden="true">₫</span>
      </div>

      <div className={styles.topoFoot}>
        <p className={clsx(styles.topoStatus, phase === 'stuck' && styles.topoWarn)} aria-live="polite">{status}</p>
        {phase === 'stuck' ? (
          <button type="button" className={styles.primaryBtn} onClick={inquire}>Inquiry</button>
        ) : (
          <button type="button" className={styles.primaryBtn} onClick={send} disabled={phase === 'moving' || phase === 'middle' || phase === 'inquiring'}>
            {phase === 'done' ? 'Chuyển lại 1M' : 'Chuyển 1M'}
          </button>
        )}
      </div>
    </div>
  );
}
