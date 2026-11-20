import clsx from 'clsx';
import styles from './MascotPortrait.module.scss';

const KINDS = ['bear', 'bunny', 'cat'];

/** The still picture of a mascot, rendered from the 3D figure. */
export function portraitSrc(kind) {
  return `/imgs/surprise/${KINDS.includes(kind) ? kind : 'bear'}.webp`;
}

/** `label` names it for screen readers; without one it is decoration. */
export default function MascotPortrait({ kind, size = 96, label = '', className }) {
  return (
    <img
      className={clsx(styles.portrait, className)}
      src={portraitSrc(kind)}
      width={size}
      height={Math.round(size * 1.25)}
      alt={label}
      aria-hidden={label ? undefined : true}
      loading="lazy"
      decoding="async"
    />
  );
}
