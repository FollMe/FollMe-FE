import { useCardText } from './CardLang';
import styles from './StoryTimeline.module.scss';

/** "Chuyện chúng mình": the couple's moments, down a line, in their order. */
export default function StoryTimeline({ story, headingClassName }) {
  const t = useCardText();
  return (
    <div className={styles.story}>
      <h2 className={headingClassName}>{t.story}</h2>
      <ol className={styles.line}>
        {story.map((item, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={`${item.title}-${i}`} style={{ '--i': i }}>
            <span className={styles.dot} aria-hidden>{i === story.length - 1 ? '♥' : ''}</span>
            {item.when && <span className={styles.when}>{item.when}</span>}
            <h3 className={styles.title}>{item.title}</h3>
            {item.text && <p className={styles.text}>{item.text}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
