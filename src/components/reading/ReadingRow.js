import { Link } from 'react-router-dom';
import { IoNewspaperOutline, IoLibraryOutline } from 'react-icons/io5';
import styles from './Reading.module.scss';

/** A compact link to a post in the reading list. */
export default function ReadingRow({ item, action }) {
  return (
    <div className={styles.row}>
      <Link to={item.to} className={styles.rowLink}>
        <span className={styles.thumb}>
          {item.image
            ? <img src={item.image} alt="" loading="lazy" />
            : (item.type === 'blog' ? <IoNewspaperOutline /> : <IoLibraryOutline />)}
        </span>
        <span className={styles.rowText}>
          <span className={styles.rowTitle}>{item.title}</span>
          {item.subtitle && <span className={styles.rowSub}>{item.subtitle}</span>}
        </span>
      </Link>
      {action}
    </div>
  );
}
