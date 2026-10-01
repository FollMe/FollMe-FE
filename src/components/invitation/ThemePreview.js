import clsx from 'clsx';
import { isCoupleEvent } from 'util/invitation';
import styles from './ThemePreview.module.scss';

/** A miniature of an invitation in one of the themes. */
export default function ThemePreview({ theme, type, groomName, brideName, title, startAt, className }) {
  const couple = isCoupleEvent(type) && groomName && brideName;
  return (
    <div className={clsx(styles.preview, styles[`theme_${theme}`], className)} aria-hidden>
      <div className={styles.previewPaper}>
        <small>Trân trọng kính mời bạn</small>
        <strong>{couple ? `${groomName} & ${brideName}` : (title || 'Tên sự kiện')}</strong>
        <span className={styles.previewDivider}>{couple ? '囍' : '✦'}</span>
        <em>{startAt?.isValid?.() ? startAt.format('HH:mm · DD/MM/YYYY') : startAt}</em>
      </div>
    </div>
  );
}
