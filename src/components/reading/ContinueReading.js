import { Link } from 'react-router-dom';
import { IoArrowForward, IoBookmarkOutline, IoTimeOutline } from 'react-icons/io5';
import useReadingList from './useReadingList';
import ReadingRow from './ReadingRow';
import styles from './Reading.module.scss';

const SHOWN = 3;

/**
 * Home page shortcut back into what this visitor was reading. Renders
 * nothing for first-time visitors.
 */
export default function ContinueReading({ className }) {
  const { bookmarks, history } = useReadingList();
  if (bookmarks.length === 0 && history.length === 0) {
    return null;
  }
  return (
    <section className={className}>
      <div className={styles.homeHead}>
        <div>
          <div className="eyebrow">Dành cho bạn</div>
          <h2 className={styles.homeTitle}>Tiếp tục đọc</h2>
        </div>
        <Link to="/doc-sau" className={styles.homeAll}>Danh sách của bạn <IoArrowForward /></Link>
      </div>
      <div className={styles.columns}>
        {history.length > 0 && (
          <div className={styles.column}>
            <h3><IoTimeOutline /> Đọc gần đây</h3>
            {history.slice(0, SHOWN).map(item => <ReadingRow key={item.key} item={item} />)}
          </div>
        )}
        {bookmarks.length > 0 && (
          <div className={styles.column}>
            <h3><IoBookmarkOutline /> Đọc sau</h3>
            {bookmarks.slice(0, SHOWN).map(item => <ReadingRow key={item.key} item={item} />)}
          </div>
        )}
      </div>
    </section>
  );
}
