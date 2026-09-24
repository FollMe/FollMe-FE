import { useState } from 'react';
import clsx from 'clsx';
import styles from './Avatar.module.scss';

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Avatar({ src, name, size = 40, className }) {
  const [hasError, setHasError] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={clsx(styles.avatar, className)}
        style={style}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span className={clsx(styles.avatar, styles.fallback, className)} style={style} aria-label={name}>
      {getInitials(name)}
    </span>
  )
}
