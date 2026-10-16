import clsx from 'clsx';
import { IoMusicalNotes, IoVolumeMuteOutline } from 'react-icons/io5';
import { useCardText } from './CardLang';
import styles from './MusicToggle.module.scss';

/** The floating record that turns while the music plays. */
export default function MusicToggle({ isPlaying, onToggle }) {
  const t = useCardText();
  return (
    <button
      type="button"
      className={clsx(styles.toggle, isPlaying && styles.playing)}
      onClick={onToggle}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? t.musicOff : t.musicOn}
      title={isPlaying ? t.musicOff : t.musicOn}
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
