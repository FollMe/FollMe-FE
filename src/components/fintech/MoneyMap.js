import clsx from 'clsx';
import { prefersReducedMotion } from './usePlayer';
import styles from './Flow.module.scss';

function display(bucket, money) {
  const value = money[bucket.id];
  if (!value) {
    return '–';
  }
  if (value === 'pending') return '100k · pending';
  if (value === 'final') return '100k · final';
  return value;
}

/**
 * Where the 100k is after the current step. When the step moves money, a
 * coin flies from the source bucket to the destination one.
 */
export default function MoneyMap({ flow, index }) {
  const step = flow.steps[index];
  const prev = index > 0 ? flow.steps[index - 1] : null;
  const ids = flow.buckets.map(b => b.id);
  const [from, to] = step.moneyMoves && step.moneyMoves.includes('→') ? step.moneyMoves.split('→') : [];
  const fromIdx = ids.indexOf(from);
  const toIdx = ids.indexOf(to);
  const flying = fromIdx >= 0 && toIdx >= 0 && !prefersReducedMotion();

  return (
    <div className={styles.money}>
      <div className={styles.moneyHead}>
        <span>100k đang ở đâu</span>
        {step.moneyMoves === 'hold' && <span className={styles.moneyTag}>đang hold, chưa đi đâu</span>}
        {from && <span className={clsx(styles.moneyTag, styles.moneyTagMove)}>tiền đang đi</span>}
        {!step.moneyMoves && <span className={styles.moneyTagQuiet}>không đổi gì</span>}
      </div>
      <div className={styles.buckets} style={{ '--n': ids.length }}>
        {flow.buckets.map((b, i) => {
          const changed = prev && display(b, prev.money) !== display(b, step.money);
          const has = Boolean(step.money[b.id]);
          const held = (b.id === 'user' && step.money.userHeld) || (b.id === 'units' && step.money.unitsLocked);
          return (
            <div
              key={`${b.id}-${changed ? index : 'same'}`}
              className={clsx(styles.bucket, has && styles.bucketFull, changed && styles.bucketChanged, (i === fromIdx || i === toIdx) && styles.bucketEnd)}
            >
              <span className={styles.bucketLabel}>{b.label}</span>
              <strong className={styles.bucketValue}>{display(b, step.money)}</strong>
              {held && <span className={styles.bucketBadge}>{b.id === 'user' ? 'đang hold' : 'đang lock'}</span>}
              {b.hint && <span className={styles.bucketHint}>{b.hint}</span>}
            </div>
          );
        })}
        {flying && (
          <span
            key={`coin-${flow.key}-${index}`}
            className={styles.flyCoin}
            style={{ '--from': `${((fromIdx + 0.5) / ids.length) * 100}%`, '--to': `${((toIdx + 0.5) / ids.length) * 100}%` }}
            aria-hidden="true"
          >
            ₫
          </span>
        )}
      </div>
    </div>
  );
}
