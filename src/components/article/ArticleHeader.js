import { Link } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import Avatar from 'components/Avatar';
import styles from './Article.module.scss';

/**
 * Header for long-form pages (blog posts, chapters, short stories).
 *
 * @param {{to: string, label: string}} back - link shown above the title
 * @param {Array<React.ReactNode>} meta - small items shown after the author
 */
export default function ArticleHeader({ back, eyebrow, title, subtitle, author, meta = [], actions }) {
  return (
    <header className={styles.header}>
      {back && (
        <Link to={back.to} className={styles.back}>
          <IoArrowBack /> {back.label}
        </Link>
      )}
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={styles.metaRow}>
        <div className={styles.meta}>
          {author && (
            <span className={styles.author}>
              <Avatar name={author} size={36} />
              <span>{author}</span>
            </span>
          )}
          {meta.filter(Boolean).map((item, index) => (
            <span key={index} className={styles.metaItem}>{item}</span>
          ))}
        </div>
        {actions}
      </div>
    </header>
  )
}
