import clsx from 'clsx';
import styles from 'pages/fintech/Fintech.module.scss';

/** Tabs to switch between the flows (or variants) of one article. */
export default function FlowTabs({ flows, flowKey, onChange, label = 'Chọn luồng' }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {Object.values(flows).map(f => (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={f.key === flowKey}
          className={clsx(f.key === flowKey && styles.tabOn)}
          onClick={() => onChange(f.key)}
        >
          <strong>{f.short}</strong>
          <span>{f.title}</span>
        </button>
      ))}
    </div>
  );
}
