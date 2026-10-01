import clsx from 'clsx';
import { IoMusicalNotes, IoVolumeMuteOutline } from 'react-icons/io5';
import styles from './MusicToggle.module.scss';

/** The floating record that turns while the music plays. */
export default function MusicToggle({ isPlaying, onToggle }) {
  return (
    <button
      type="button"
      className={clsx(styles.toggle, isPlaying && styles.playing)}
      onClick={onToggle}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
      title={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
    >
      <span className={styles.disc} aria-hidden="true">
        {isPlaying ? <IoMusicalNotes /> : <IoVolumeMuteOutline />}
      </span>
      {isPlaying && (
        <span className={styles.notes} aria-hidden="true">
          <i>♪</i><i>♫</i><i>♪</i>
        </span>
      )}
    </button>
  );
}
