import { useMemo } from 'react';
import styles from './Petals.module.scss';

/** Falling petals. `count` controls density; decorative only. */
export default function Petals({ count = 16, color }) {
  const petals = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n) => {
      const x = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
      return x - Math.floor(x);
    };
    return {
      left: `${Math.round(r(1) * 100)}%`,
      size: 8 + Math.round(r(2) * 10),
      delay: `${(r(3) * 8).toFixed(2)}s`,
      duration: `${(9 + r(4) * 8).toFixed(2)}s`,
      drift: `${Math.round((r(5) - 0.5) * 160)}px`,
      spin: `${Math.round(180 + r(6) * 540)}deg`,
    };
  }), [count]);

  return (
    <div className={styles.petals} aria-hidden style={color ? { '--petal': color } : undefined}>
      {petals.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--drift': p.drift,
            '--spin': p.spin,
          }}
        />
      ))}
    </div>
  );
}
