import styles from './PageHeader.module.scss';

export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <div className={styles.text}>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </div>
  )
}
