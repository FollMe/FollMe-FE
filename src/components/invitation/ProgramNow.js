import clsx from 'clsx';
import { programState } from 'util/program';
import { useEventClock } from './ProgramTimeline';
import styles from './ProgramNow.module.scss';

// Only on the day: the program says nothing useful weeks before
const NEAR_MS = 12 * 60 * 60 * 1000;

/**
 * "Đang diễn ra: Khai tiệc · Tiếp theo 18:30 Cắt bánh" for the venue screen
 * and the reception desk. Sizes follow the parent's font size. `at` pins
 * the clock (sample screen).
 */
export default function ProgramNow({ program = [], startAt, at, className }) {
  const clock = useEventClock(startAt);
  const now = at ?? clock;
  if (!program.length || Math.abs(now - new Date(startAt).getTime()) > NEAR_MS) {
    return null;
  }
  const { current, next } = programState(program, startAt, now);
  if (current < 0 && next < 0) {
    return null;
  }
  return (
    <p className={clsx(styles.now, className)}>
      {current >= 0 && (
        <span className={styles.current}>
          <i aria-hidden />
          <span className={styles.tag}>Đang diễn ra</span> {program[current].label}
        </span>
      )}
      {next >= 0 && (
        <span className={styles.next}>
          Tiếp theo · <strong>{program[next].time}</strong> {program[next].label}
        </span>
      )}
    </p>
  );
}
