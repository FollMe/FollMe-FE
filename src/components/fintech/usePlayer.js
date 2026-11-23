import { useCallback, useEffect, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A step index with play / pause: plays forward every `interval` ms and
 * stops on the last step. Pressing play on the last step starts over.
 */
export default function usePlayer(length, { interval = 2600 } = {}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    if (index >= length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => setIndex(i => Math.min(i + 1, length - 1)), interval);
    return () => clearTimeout(timer);
  }, [playing, index, length, interval]);

  const go = useCallback(i => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(length - 1, i)));
  }, [length]);

  const toggle = useCallback(() => {
    setPlaying(p => {
      if (!p && index >= length - 1) {
        setIndex(0);
      }
      return !p;
    });
  }, [index, length]);

  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);

  return {
    index,
    playing,
    go,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    toggle,
    reset,
    isFirst: index === 0,
    isLast: index === length - 1,
  };
}
