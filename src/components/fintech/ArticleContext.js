import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { prefersReducedMotion } from './usePlayer';
import styles from './Context.module.scss';

/**
 * A small phone showing what the user actually does, so the article starts
 * from a screen everyone has seen. `screen` lists rows; the row with
 * `action` is the button that gets tapped, then `after` replaces the rows.
 */
function PhoneMock({ title, rows, action, after, doneLabel = 'Xong' }) {
  const [tapped, setTapped] = useState(prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const timer = setTimeout(() => setTapped(t => !t), tapped ? 3800 : 2200);
    return () => clearTimeout(timer);
  }, [tapped]);

  const shown = tapped && after ? after : rows;

  return (
    <div className={styles.phone} aria-hidden="true">
      <div className={styles.notch} />
      <div className={styles.screenTitle}>{title}</div>
      <div key={tapped ? 'after' : 'before'} className={styles.screenBody}>
        {shown.map(r => (
          <div key={r.label} className={clsx(styles.row, r.big && styles.rowBig, r.good && styles.rowGood)}>
            <span>{r.label}</span>
            {r.value && <strong>{r.value}</strong>}
          </div>
        ))}
      </div>
      {action && (
        <div className={clsx(styles.cta, tapped && styles.ctaDone)}>
          {tapped ? doneLabel : action}
          {!tapped && <i className={styles.finger} />}
        </div>
      )}
    </div>
  );
}

/**
 * "What is this and why should I care" block at the top of a fintech
 * article: a phone with the user's action, three short answers, and the
 * handful of terms the article uses.
 */
export default function ArticleContext({ phone, scene, points, glossary }) {
  return (
    <section className={styles.context} aria-labelledby="boi-canh">
      <div className={styles.top}>
        <PhoneMock {...phone} />
        <div className={styles.story}>
          <h2 id="boi-canh">Bối cảnh</h2>
          <p className={styles.scene}>{scene}</p>
          <dl className={styles.points}>
            {points.map(p => (
              <div key={p.q}>
                <dt>{p.q}</dt>
                <dd>{p.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {glossary?.length > 0 && (
        <details className={styles.glossary}>
          <summary>Thuật ngữ dùng trong bài ({glossary.length})</summary>
          <dl>
            {glossary.map(g => (
              <div key={g.term}>
                <dt>{g.term}</dt>
                <dd>{g.def}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </section>
  );
}
