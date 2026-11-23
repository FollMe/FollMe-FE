import { IoPlay, IoPause, IoPlaySkipBack, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import styles from './Flow.module.scss';

/** Reset / back / play-pause / next, plus "3 / 12". */
export default function PlayerControls({ player, total, label }) {
  return (
    <div className={styles.controls} role="group" aria-label={label}>
      <button type="button" onClick={player.reset} disabled={player.isFirst} aria-label="Về bước đầu">
        <IoPlaySkipBack />
      </button>
      <button type="button" onClick={player.prev} disabled={player.isFirst} aria-label="Bước trước">
        <IoChevronBack />
      </button>
      <button type="button" className={styles.play} onClick={player.toggle} aria-label={player.playing ? 'Tạm dừng' : 'Chạy'}>
        {player.playing ? <IoPause /> : <IoPlay />}
        <span>{player.playing ? 'Dừng' : player.isLast ? 'Chạy lại' : 'Chạy'}</span>
      </button>
      <button type="button" onClick={player.next} disabled={player.isLast} aria-label="Bước sau">
        <IoChevronForward />
      </button>
      <span className={styles.counter} aria-live="polite">
        {player.index + 1} / {total}
      </span>
    </div>
  );
}
