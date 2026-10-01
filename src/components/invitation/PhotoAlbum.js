import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoChevronBack, IoChevronForward, IoClose } from 'react-icons/io5';
import { cldUrl } from 'util/photos';
import { track } from 'util/analytics';
import styles from './PhotoAlbum.module.scss';

// Cloudinary crops per tile shape, keeping faces in frame
const CROPS = {
  feature: 'w_1200,h_900,c_fill,g_faces',
  tall: 'w_640,h_800,c_fill,g_faces',
  wide: 'w_1200,h_800,c_fill,g_faces',
};

/**
 * One big photo, then pairs; an odd one out at the end gets the full width,
 * so the album never ends on a gap.
 */
export function tileShape(index, count) {
  if (index === 0) {
    return 'feature';
  }
  const last = index === count - 1;
  return last && (count - 1) % 2 === 1 ? 'wide' : 'tall';
}

/** The album; a tap opens the photo full screen. */
export default function PhotoAlbum({ photos, title = 'Khoảnh khắc', demo }) {
  const [openAt, setOpenAt] = useState(null);

  return (
    <div className={styles.album}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.wall}>
        {photos.map((photo, i) => {
          const shape = tileShape(i, photos.length);
          return (
            <li key={photo._id ?? photo.url} className={styles[shape]} style={{ '--i': i }}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => {
                  setOpenAt(i);
                  track('album_photo_opened', { demo });
                }}
                aria-label={`Xem ảnh ${i + 1} trên ${photos.length}`}
              >
                <img
                  src={cldUrl(photo.url, CROPS[shape])}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
              </button>
            </li>
          );
        })}
      </ul>
      {openAt !== null && (
        <Lightbox photos={photos} index={openAt} onIndex={setOpenAt} onClose={() => setOpenAt(null)} />
      )}
    </div>
  );
}

const SWIPE_PX = 50;

/**
 * Full-screen viewer: swipe or arrow keys to move, Esc or the button to
 * close. Rendered into <body> so no transformed ancestor clips it.
 */
export function Lightbox({ photos, index, onIndex, onClose }) {
  const closeRef = useRef(null);
  const start = useRef(null);
  // A swipe that ends off the photo must not count as a tap to close
  const swiped = useRef(false);
  const count = photos.length;
  const go = useCallback(step => onIndex((index + step + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        go(-1);
      } else if (e.key === 'ArrowRight') {
        go(1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  // Warm up the neighbours so swiping does not wait on the network
  useEffect(() => {
    [index - 1, index + 1].forEach(i => {
      const photo = photos[(i + count) % count];
      if (photo) {
        new Image().src = cldUrl(photo.url, 'w_1600,c_limit');
      }
    });
  }, [index, photos, count]);

  const photo = photos[index];

  return createPortal(
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`Ảnh ${index + 1} trên ${count}`}
      onPointerDown={e => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={e => {
        const from = start.current;
        start.current = null;
        if (!from) {
          return;
        }
        const dx = e.clientX - from.x;
        swiped.current = Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - from.y);
        if (swiped.current) {
          go(dx < 0 ? 1 : -1);
        }
      }}
      onClick={e => {
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <img
        key={photo.url}
        className={styles.full}
        src={cldUrl(photo.url, 'w_1600,c_limit')}
        alt=""
        draggable={false}
      />
      <div className={styles.bar}>
        <span className={styles.counter}>{index + 1} / {count}</span>
        <button ref={closeRef} type="button" className={styles.round} onClick={onClose} aria-label="Đóng">
          <IoClose />
        </button>
      </div>
      {count > 1 && (
        <>
          <button type="button" className={`${styles.round} ${styles.prev}`} onClick={() => go(-1)} aria-label="Ảnh trước">
            <IoChevronBack />
          </button>
          <button type="button" className={`${styles.round} ${styles.next}`} onClick={() => go(1)} aria-label="Ảnh sau">
            <IoChevronForward />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
