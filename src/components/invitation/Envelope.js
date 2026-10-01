import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './Envelope.module.scss';

const OPEN_MS = 1750;

/**
 * The closed envelope a guest sees first. Tapping the seal opens the flap,
 * lifts the card out and then reveals the invitation (onOpened).
 */
export default function Envelope({ theme, recipient, headline, withMusic, onOpenStart, onOpened }) {
  const [state, setState] = useState('closed'); // closed | opening | gone

  // Keep the invitation behind the envelope from scrolling.
  const isShown = state !== 'gone';
  useEffect(() => {
    if (!isShown) {
      return undefined;
    }
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [isShown]);

  useEffect(() => {
    if (state !== 'opening') {
      return undefined;
    }
    const id = setTimeout(() => {
      setState('gone');
      onOpened?.();
    }, OPEN_MS);
    return () => clearTimeout(id);
  }, [state, onOpened]);

  if (state === 'gone') {
    return null;
  }

  return (
    <div className={clsx(styles.stage, styles[theme], state === 'opening' && styles.opening)}>
      <div className={styles.to}>
        <span>Gửi</span>
        <strong>{recipient}</strong>
      </div>

      <div className={styles.envelope}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.back} />
        <div className={styles.letter}>
          <small>Trân trọng kính mời</small>
          <strong>{headline}</strong>
        </div>
        <div className={styles.front} />
        <div className={styles.flap} />
        <button
          type="button"
          className={styles.seal}
          onClick={() => {
            // Synchronously, inside the tap: browsers only start audio here
            onOpenStart?.();
            setState('opening');
          }}
          disabled={state !== 'closed'}
          aria-label="Mở thiệp"
        >
          <span>囍</span>
        </button>
      </div>

      <p className={styles.hint}>
        Chạm vào con dấu để mở thiệp
        {withMusic && <small>♪ Bật âm thanh để nghe nhạc</small>}
      </p>
    </div>
  );
}
