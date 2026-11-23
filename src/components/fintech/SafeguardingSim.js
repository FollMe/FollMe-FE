import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { IoRefresh } from 'react-icons/io5';
import { ACTIONS, INITIAL, health, liabilities } from 'util/safeguarding';
import { prefersReducedMotion } from './usePlayer';
import styles from './Money.module.scss';

const fmt = n => `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;

const STATUS = {
  ok: { label: 'Cash ≥ liabilities', text: 'Đúng luật. Phần chênh là buffer.' },
  drift: { label: 'Cash ≥ liabilities, nhưng ledger lệch', text: 'Vẫn đủ tiền, nhưng ledger không còn giải thích được số dư bank. Reconciliation sẽ phải đi tìm 1M này.' },
  breach: { label: 'Cash < liabilities', text: 'Vi phạm: tiền của user đã bị dùng vào việc không được phép.' },
};

/**
 * Click an action and watch the two layers: ledger rows (liabilities) on
 * one side, real cash in the safeguarding account on the other, and the
 * one comparison that must always hold.
 */
export default function SafeguardingSim() {
  const [state, setState] = useState(INITIAL);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null);
  const [note, setNote] = useState('Bấm một thao tác bên dưới. Mỗi bước sẽ sáng lên ở layer mà nó chạm vào.');
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run(key) {
    const { phases } = ACTIONS[key];
    const gap = prefersReducedMotion() ? 0 : 1100;
    setBusy(true);
    phases.forEach((phase, i) => {
      timers.current.push(setTimeout(() => {
        setState(s => phase.apply(s));
        setFlash({ layer: phase.layer, at: Date.now() });
        setNote(phase.note);
        if (i === phases.length - 1) setBusy(false);
      }, i * gap));
    });
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    setState(INITIAL);
    setBusy(false);
    setFlash(null);
    setNote('Về lại trạng thái đầu: user có 10M trong ví, safeguarding account có 10,5M (buffer 0,5M).');
  }

  const L = liabilities(state);
  const status = health(state);
  const max = Math.max(L, state.cash, 1);
  const lit = layer => flash && (flash.layer === layer || flash.layer === 'both');

  return (
    <div className={styles.sim}>
      <div className={styles.simLayers}>
        <div key={`l-${lit('ledger') ? flash.at : 0}`} className={clsx(styles.layer, lit('ledger') && styles.layerLit)}>
          <div className={styles.layerHead}><span>Ledger</span><em>lời hứa · instant</em></div>
          <dl>
            <dt>Ví user</dt><dd>{fmt(state.user)}</dd>
            <dt>Pocket partner</dt><dd>{fmt(state.pocket)}</dd>
            <dt className={styles.total}>Σ liabilities</dt><dd className={styles.total}>{fmt(L)}</dd>
          </dl>
        </div>
        <div key={`b-${lit('bank') ? flash.at : 0}`} className={clsx(styles.layer, styles.layerBank, lit('bank') && styles.layerLit)}>
          <div className={styles.layerHead}><span>Bank</span><em>tiền thật · vài giây tới một ngày</em></div>
          <dl>
            <dt>Safeguarding account</dt><dd>{fmt(state.cash)}</dd>
            <dt className={styles.total}>Buffer</dt>
            <dd className={clsx(styles.total, state.cash < L && styles.neg)}>{fmt(state.cash - L)}</dd>
          </dl>
        </div>
      </div>

      <div className={styles.bars} aria-hidden="true">
        <div className={styles.barRow}>
          <span>Liabilities</span>
          <i style={{ width: `${(L / max) * 100}%` }} className={styles.barL} />
        </div>
        <div className={styles.barRow}>
          <span>Cash</span>
          <i style={{ width: `${(state.cash / max) * 100}%` }} className={clsx(styles.barC, status === 'breach' && styles.barBad)} />
        </div>
      </div>

      <div className={clsx(styles.verdict, styles[`verdict_${status}`])} role="status">
        <strong>{STATUS[status].label}</strong>
        <span>{STATUS[status].text}</span>
      </div>

      <p key={note} className={styles.simNote}>{note}</p>

      <div className={styles.simActions}>
        {Object.entries(ACTIONS).map(([key, a]) => (
          <button key={key} type="button" disabled={busy || (a.can && !a.can(state))} onClick={() => run(key)}>
            {a.label}
          </button>
        ))}
        <button type="button" className={styles.reset} onClick={reset}><IoRefresh /> Làm lại</button>
      </div>
    </div>
  );
}
