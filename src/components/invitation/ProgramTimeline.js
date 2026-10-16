import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { programState } from 'util/program';
import { useCardText } from './CardLang';
import styles from './ProgramTimeline.module.scss';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The clock, ticking every half minute around the day of the event only. */
export function useEventClock(startAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Math.abs(Date.now() - new Date(startAt).getTime()) > DAY_MS) {
      return undefined;
    }
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [startAt]);
  return now;
}

/**
 * The program of the day as a timeline. On the day, the moment under way
 * is lit and the ones before it fade.
 */
export default function ProgramTimeline({ program, startAt }) {
  const t = useCardText();
  const now = useEventClock(startAt);
  const { current, isOver } = programState(program, startAt, now);
  return (
    <ol className={styles.timeline} aria-label={t.program}>
      {program.map((item, i) => {
        const isNow = i === current;
        return (
          <li
            key={`${item.time}-${i}`}
            className={clsx(isNow && styles.now, (isOver || (current >= 0 && i < current)) && styles.done)}
            aria-current={isNow ? 'time' : undefined}
          >
            <time>{item.time}</time>
            <span className={styles.dot} aria-hidden />
            <span className={styles.label}>
              {item.label}
              {isNow && <em>{t.programNow}</em>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
