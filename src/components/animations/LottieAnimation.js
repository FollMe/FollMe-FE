import { useEffect, useRef } from 'react';

/**
 * A looping Lottie animation, fetched only when it is shown: the player
 * (SVG-only build) and the animation are split off the main bundle.
 * `load` returns the animation JSON module, e.g. () => import('x.json').
 */
export default function LottieAnimation({ load, style }) {
  const container = useRef(null);

  useEffect(() => {
    let animation;
    let active = true;
    Promise.all([import('lottie-web/build/player/esm/lottie_light.min.js'), load()])
      .then(([player, data]) => {
        if (active && container.current) {
          animation = (player.default ?? player).loadAnimation({
            container: container.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: data.default ?? data,
          });
        }
      })
      .catch(() => {
        // Decoration only: nothing to show if it fails to load
      });
    return () => {
      active = false;
      // Only this one: lottie.destroy() would stop every animation on the page
      animation?.destroy();
    };
  }, [load]);

  return <div style={style} ref={container} />;
}
