import styles from './MonthCalendar.module.scss';

const HEAD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** The month of the event with its day circled, like a printed invitation. */
export default function MonthCalendar({ date }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div className={styles.calendar}>
      <div className={styles.title}>Tháng {month + 1} · {year}</div>
      <div className={styles.grid} role="grid" aria-label={`Tháng ${month + 1} năm ${year}`}>
        {HEAD.map(h => <span key={h} className={styles.head}>{h}</span>)}
        {cells.map((d, i) => (
          <span key={i} className={d === date.getDate() ? styles.day + ' ' + styles.marked : styles.day}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
