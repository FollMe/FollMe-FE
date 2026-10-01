import styles from './InvitationLoading.module.scss';

/** Shown while an invitation loads: a pulsing seal on rice paper. */
export default function InvitationLoading() {
  return (
    <div className={styles.wrap} role="status" aria-label="Đang mở thiệp">
      <span className={styles.seal}>囍</span>
      <span className={styles.text}>Đang mở thiệp…</span>
    </div>
  );
}
