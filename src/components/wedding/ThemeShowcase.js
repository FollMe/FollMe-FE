import { Link } from 'react-router-dom';
import ThemePreview from 'components/invitation/ThemePreview';
import { THEMES } from 'util/invitation';
import styles from './Wedding.module.scss';

const SAMPLES = {
  blush: { groomName: 'Minh', brideName: 'Lan', startAt: '11:00 · 12/12/2026' },
  classic: { groomName: 'Hùng', brideName: 'Mai', startAt: '10:30 · 06/02/2027' },
  minimal: { groomName: 'Tuấn', brideName: 'Vy', startAt: '18:00 · 20/03/2027' },
  night: { groomName: 'Khoa', brideName: 'Ngân', startAt: '18:30 · 15/05/2027' },
};

/** The invitation themes as small samples linking to the editor. */
export default function ThemeShowcase() {
  return (
    <div className={styles.showcase}>
      {THEMES.map(t => (
        <Link key={t.value} to={`/events/create?type=wedding`} className={styles.showcaseItem}>
          <ThemePreview theme={t.value} type="wedding" {...SAMPLES[t.value]} />
          <strong>{t.label}</strong>
          <span>{t.hint}</span>
        </Link>
      ))}
    </div>
  );
}
