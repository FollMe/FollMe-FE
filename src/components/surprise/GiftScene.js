import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { createGiftScene } from './scene3d';
import { portraitSrc } from './MascotPortrait';
import styles from './GiftScene.module.scss';

/**
 * The 3D stage (gift box, pedestal, mascot). `mood` drives the mascot,
 * `opened` lifts the lid, each new `celebrate` number sets off fireworks,
 * and `gift` (an emoji) rises out of the open box. Without WebGL it shows
 * the mascot's picture.
 */
export default function GiftScene({
  kind = 'bear', mood = 'idle', opened = false, celebrate = 0, gift = null, label, className,
}) {
  const holder = useRef(null);
  const canvas = useRef(null);
  const scene = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let created;
    try {
      created = createGiftScene(canvas.current, {
        kind,
        reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      });
    } catch (err) {
      setFailed(true);
      return undefined;
    }
    scene.current = created;
    const resize = new ResizeObserver(([entry]) => created.resize(entry.contentRect.width, entry.contentRect.height));
    resize.observe(holder.current);
    // Off screen (scrolled to the letter), the loop rests
    const seen = new IntersectionObserver(([entry]) => (entry.isIntersecting ? created.start() : created.stop()));
    seen.observe(holder.current);
    return () => {
      resize.disconnect();
      seen.disconnect();
      created.dispose();
      scene.current = null;
    };
  }, [kind]);

  useEffect(() => {
    scene.current?.setState({ mood, opened, celebrate, gift });
  }, [mood, opened, celebrate, gift, kind]);

  return (
    <div ref={holder} className={clsx(styles.scene, className)} role="img" aria-label={label}>
      {failed ? <img className={styles.fallback} src={portraitSrc(kind)} alt="" /> : <canvas ref={canvas} />}
    </div>
  );
}
