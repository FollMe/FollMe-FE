import { useEffect, useRef, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { invitationApi } from 'util/invitation';
import { track } from 'util/analytics';
import { useCardText } from './CardLang';
import styles from './SeatFinder.module.scss';

/**
 * "Bạn ngồi bàn nào?" on the shared link, on the day: a guest types their
 * name and sees their table, like the board at the entrance. Shows only
 * when the host made a seating plan.
 */
export default function SeatFinder({ eventId, headingClassName }) {
  const card = useCardText();
  const t = card.seat;
  const [hasTables, setHasTables] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const latest = useRef(0);

  useEffect(() => {
    invitationApi.findSeat(eventId, '')
      .then(res => setHasTables(Boolean(res.open && res.hasTables)))
      .catch(() => setHasTables(false));
  }, [eventId]);

  // Looks up as they type, a moment after the last key; only the latest answer counts
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResult(null);
      return undefined;
    }
    const id = ++latest.current;
    const timer = setTimeout(() => {
      invitationApi.findSeat(eventId, q)
        .then(res => {
          if (id === latest.current) {
            setResult({ q, matches: res.matches ?? [] });
            if (res.matches?.some(m => m.table)) {
              track('seat_found');
            }
          }
        })
        .catch(() => id === latest.current && setResult({ q, failed: true }));
    }, 350);
    return () => clearTimeout(timer);
  }, [eventId, query]);

  if (!hasTables) {
    return null;
  }
  return (
    <div className={styles.finder}>
      <h2 className={headingClassName}>{t.title}</h2>
      <label className={styles.search}>
        <IoSearch aria-hidden />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.placeholder}
          aria-label={t.label}
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <div className={styles.results} aria-live="polite">
        {result?.failed && <p className={styles.note}>{t.failed}</p>}
        {result && !result.failed && result.matches.length === 0 && (
          <p className={styles.note}>{t.none(result.q)}</p>
        )}
        {result?.matches?.length > 0 && (
          <ul>
            {result.matches.map(m => (
              <li key={`${m.name}-${m.table}`}>
                <span>{m.name}</span>
                {m.table
                  ? <strong>{card.table(m.table)}</strong>
                  : <em>{t.noTable}</em>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
