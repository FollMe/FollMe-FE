import { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './NumerologyResult.module.scss';

// Pythagorean birth chart layout.
const GRID = [
  [3, 6, 9],
  [2, 5, 8],
  [1, 4, 7],
];

function NumberTile({ label, number }) {
  if (!number) {
    return null;
  }
  return (
    <div className={styles.tile}>
      <div className={styles.tileValue}>{number.display}</div>
      <div className={styles.tileLabel}>{label}</div>
    </div>
  );
}

/**
 * The shareable numerology card. It deliberately shows no name or birth date,
 * so exporting it as an image does not leak personal data.
 */
const NumerologyResult = forwardRef(function NumerologyResult({ result, lifePathTitle }, ref) {
  const presentArrows = result.birthChart.arrows?.filter(a => a.present) ?? [];
  const emptyArrows = result.birthChart.arrows?.filter(a => !a.present) ?? [];

  return (
    <div ref={ref} className={styles.card}>
      <div className={styles.hero}>
        <div className="eyebrow">Số chủ đạo</div>
        <div className={styles.lifePath}>{result.lifePath.display}</div>
        {lifePathTitle && <div className={styles.lifePathTitle}>{lifePathTitle}</div>}
      </div>

      <div className={styles.tiles}>
        <NumberTile label="Ngày sinh" number={result.birthday} />
        <NumberTile label="Thái độ" number={result.attitude} />
        <NumberTile label="Sứ mệnh" number={result.expression} />
        <NumberTile label="Linh hồn" number={result.soulUrge} />
        <NumberTile label="Nhân cách" number={result.personality} />
        <NumberTile label={`Năm cá nhân ${result.currentYear}`} number={result.personalYear} />
      </div>

      <div className={styles.chartRow}>
        <div>
          <div className={styles.subTitle}>Biểu đồ ngày sinh</div>
          <div className={styles.grid} role="table" aria-label="Biểu đồ ngày sinh">
            {GRID.flat().map(digit => {
              const count = result.birthChart.counts[digit];
              return (
                <div key={digit} className={clsx(styles.cell, count === 0 && styles.cellEmpty)} role="cell">
                  {count > 0 ? String(digit).repeat(count) : digit}
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.arrows}>
          <div className={styles.subTitle}>Mũi tên</div>
          {presentArrows.length === 0 && emptyArrows.length === 0 && <div className="muted">Không có mũi tên nào</div>}
          {presentArrows.map(a => (
            <span key={a.id} className={clsx(styles.chip, styles.chipStrong)}>{a.digits.join('-')}</span>
          ))}
          {emptyArrows.map(a => (
            <span key={a.id} className={clsx(styles.chip, styles.chipEmpty)}>trống {a.digits.join('-')}</span>
          ))}
        </div>
      </div>

      <div className={styles.subTitle}>Bốn đỉnh cao</div>
      <div className={styles.peaks}>
        {result.peaks.map((peak, i) => (
          <div key={i} className={styles.peak}>
            <div className={styles.peakAge}>{peak.age} tuổi</div>
            <div className={styles.peakValue}>{peak.display}</div>
          </div>
        ))}
      </div>

      <div className={styles.brand}>follme · thần số học</div>
    </div>
  );
});

export default NumerologyResult;
