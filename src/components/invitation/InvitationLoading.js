import { cardText, urlCardLang } from 'util/cardText';
import styles from './InvitationLoading.module.scss';

/** Shown while an invitation loads: a pulsing seal on rice paper. */
export default function InvitationLoading() {
  // Only the link says the language yet (?lang=en)
  const t = cardText(urlCardLang());
  return (
    <div className={styles.wrap} role="status" aria-label={t.loading.replace('…', '')}>
      <span className={styles.seal}>囍</span>
      <span className={styles.text}>{t.loading}</span>
    </div>
  );
}
