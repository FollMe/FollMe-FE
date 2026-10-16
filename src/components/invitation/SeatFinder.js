import { useEffect, useRef, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { invitationApi } from 'util/invitation';
import { tableLabel } from 'util/seating';
import { track } from 'util/analytics';
import styles from './SeatFinder.module.scss';

/**
 * "Bạn ngồi bàn nào?" on the shared link, on the day: a guest types their
 * name and sees their table, like the board at the entrance. Shows only
 * when the host made a seating plan.
 */
export default function SeatFinder({ eventId, headingClassName }) {
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
      <h2 className={headingClassName}>Bạn ngồi bàn nào?</h2>
      <label className={styles.search}>
        <IoSearch aria-hidden />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Gõ tên của bạn, không dấu cũng được"
          aria-label="Tên để tìm bàn"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <div className={styles.results} aria-live="polite">
        {result?.failed && <p className={styles.note}>Chưa tra được, thử lại sau giây lát nhé.</p>}
        {result && !result.failed && result.matches.length === 0 && (
          <p className={styles.note}>Không thấy tên “{result.q}”. Thử gõ tên khác, hoặc hỏi người đón khách ở cửa nhé.</p>
        )}
        {result?.matches?.length > 0 && (
          <ul>
            {result.matches.map(m => (
              <li key={`${m.name}-${m.table}`}>
                <span>{m.name}</span>
                {m.table
                  ? <strong>{tableLabel(m.table)}</strong>
                  : <em>Chưa xếp bàn, hỏi người đón khách nhé</em>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
