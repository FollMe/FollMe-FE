import { useEffect, useState } from 'react';

/**
 * Thin progress bar pinned under the header showing how far the page has been read.
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      setProgress(max > 0 ? Math.min(1, scrollTop / max) : 0);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 'var(--header-h)',
        left: 0,
        right: 0,
        height: 3,
        zIndex: 99,
        transformOrigin: '0 50%',
        transform: `scaleX(${progress})`,
        background: 'linear-gradient(90deg, var(--brand), #f59e0b)',
        transition: 'transform 0.1s linear',
      }}
    />
  )
}
