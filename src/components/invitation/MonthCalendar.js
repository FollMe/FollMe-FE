import { useCardText } from './CardLang';
import styles from './MonthCalendar.module.scss';

/** The month of the event with its day circled, like a printed invitation. */
export default function MonthCalendar({ date }) {
  const t = useCardText();
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div className={styles.calendar}>
      <div className={styles.title}>{t.monthTitle(month, year)}</div>
      {/* A picture of the month: read out as one sentence, not 35 numbers */}
      <div
        className={styles.grid}
        role="img"
        aria-label={t.monthLabel(month, year, date.getDate())}
      >
        {t.weekHead.map(h => <span key={h} className={styles.head}>{h}</span>)}
        {cells.map((d, i) => (
          <span key={i} className={d === date.getDate() ? styles.day + ' ' + styles.marked : styles.day}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
