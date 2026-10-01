import { useState } from 'react';
import clsx from 'clsx';
import { IoStar, IoStarOutline, IoTimeOutline, IoColorPaletteOutline } from 'react-icons/io5';
import { ZODIAC, getMyZodiac, setMyZodiac, zodiacOf } from 'util/fortune';
import styles from './ZodiacToday.module.scss';

export function Stars({ value, className }) {
  return (
    <span className={clsx(styles.stars, className)} aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map(i => (i <= value ? <IoStar key={i} /> : <IoStarOutline key={i} />))}
    </span>
  );
}

/**
 * "Tử vi hôm nay" for the 12 con giáp. The visitor's own animal (picked
 * once, remembered in this browser) is shown first and larger.
 */
export default function ZodiacToday({ day, isToday }) {
  const [mine, setMine] = useState(getMyZodiac);

  function pick(branch) {
    const next = branch === mine ? null : branch;
    setMine(next);
    setMyZodiac(next);
  }

  const readings = day.zodiac ?? [];
  const my = readings.find(z => z.branch === mine);
  const others = readings.filter(z => z.branch !== mine);

  return (
    <section className={styles.section} id="con-giap">
      <div className={styles.head}>
        <div>
          <div className="eyebrow">Tử vi {isToday ? 'hôm nay' : `ngày ${day.solar.day}/${day.solar.month}`}</div>
          <h2 className={styles.title}>12 con giáp</h2>
        </div>
        <p className={styles.hint}>Chọn con giáp của bạn, lần sau vào sẽ thấy ngay.</p>
      </div>

      <div className={styles.picker} role="radiogroup" aria-label="Con giáp của bạn">
        {ZODIAC.map(z => (
          <button
            type="button"
            key={z.branch}
            role="radio"
            aria-checked={z.branch === mine}
            className={clsx(styles.pick, z.branch === mine && styles.picked)}
            onClick={() => pick(z.branch)}
            title={`Tuổi ${z.branch} (${z.name})`}
            aria-label={`Tuổi ${z.branch}, con ${z.name}`}
          >
            <span aria-hidden>{z.emoji}</span>
            {z.branch}
          </button>
        ))}
      </div>

      {my && <ZodiacCard reading={my} featured />}

      <div className={styles.grid}>
        {others.map(z => <ZodiacCard key={z.branch} reading={z} />)}
      </div>
    </section>
  );
}

function ZodiacCard({ reading, featured }) {
  const z = zodiacOf(reading.branch);
  return (
    <article className={clsx(styles.card, featured && styles.featured, reading.stars <= 2 && styles.careful)}>
      <div className={styles.cardHead}>
        <span className={styles.emoji} aria-hidden>{z.emoji}</span>
        <div className={styles.cardName}>
          <h3>{featured ? 'Tuổi của bạn: ' : ''}{reading.branch} <span>· {reading.zodiac}</span></h3>
          <Stars value={reading.stars} />
        </div>
      </div>
      <div className={styles.headline}>{reading.headline}</div>
      <p className={styles.text}>{reading.text}</p>
      <div className={styles.meta}>
        <span><IoTimeOutline /> Giờ tốt: {reading.luckyHours.join(', ')}</span>
        <span><IoColorPaletteOutline /> Màu hợp: {reading.luckyColors.join(', ')}</span>
      </div>
    </article>
  );
}
