import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Skeleton from '@mui/material/Skeleton';
import Avatar from 'components/Avatar';
import styles from './PostCard.module.scss';

const DEFAULT_IMAGE = '/imgs/default-story-background.webp';

/**
 * Card for a blog post, story or invitation.
 *
 * @param {'default'|'featured'} variant
 * @param {Array<{icon, label}>} stats - small counters shown in the footer
 */
export default function PostCard({
  to,
  state,
  image,
  badge,
  title,
  author,
  date,
  stats = [],
  aside,
  variant = 'default',
  className,
  style,
}) {
  const hasImage = image !== null;

  return (
    <Link to={to} state={state} className={clsx(styles.card, styles[variant], !hasImage && styles.noImage, className)} style={style}>
      {hasImage && (
        <div className={styles.media}>
          <img
            src={image || DEFAULT_IMAGE}
            alt=""
            loading="lazy"
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_IMAGE;
            }}
          />
        </div>
      )}
      <div className={styles.body}>
        {(badge || aside) && (
          <div className={styles.top}>
            {badge && <span className={styles.badge}>{badge}</span>}
            {aside}
          </div>
        )}
        <h3 className={clsx(styles.title, variant === 'featured' ? 'line-clamp-3' : 'line-clamp-2')}>{title}</h3>
        <div className={styles.footer}>
          {author && (
            <div className={styles.author}>
              <Avatar name={author} size={26} />
              <span className={styles.authorName}>{author}</span>
              {date && <span className={styles.dot} aria-hidden>·</span>}
              {date && <time className={styles.date}>{date}</time>}
            </div>
          )}
          {!author && date && <time className={styles.date}>{date}</time>}
          {stats.length > 0 && (
            <div className={styles.stats}>
              {stats.map((stat, index) => (
                <span key={index} className={styles.stat} title={stat.title}>
                  {stat.icon}
                  {stat.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function PostCardSkeleton({ variant = 'default' }) {
  return (
    <div className={clsx(styles.card, styles[variant], styles.skeleton)}>
      <div className={styles.media}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
      <div className={styles.body}>
        <Skeleton width={90} height={24} sx={{ borderRadius: 99 }} />
        <Skeleton height={30} />
        <Skeleton height={30} width="70%" />
        <div className={styles.footer}>
          <Skeleton width="55%" height={26} />
        </div>
      </div>
    </div>
  )
}
