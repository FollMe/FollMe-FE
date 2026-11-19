import clsx from 'clsx';
import styles from './Mascot.module.scss';

// Fur, belly, inner ear, outline, eyes and nose per mascot
const PALETTES = {
  bear: { fur: '#c8925f', belly: '#f3d9b8', ear: '#ebb98a', line: '#9c6b40', ink: '#3b2a20', nose: '#3b2a20' },
  bunny: { fur: '#fffaf8', belly: '#ffffff', ear: '#ffc1d0', line: '#e3c4cd', ink: '#3d2c33', nose: '#ff8fab' },
  cat: { fur: '#f6b26b', belly: '#ffe8c9', ear: '#ffc1a1', line: '#d68b45', ink: '#3a2a22', nose: '#ff8f8f' },
};

function Ears({ kind, c }) {
  if (kind === 'bunny') {
    return (
      <g className={styles.ears}>
        <g transform="rotate(-12 74 40)">
          <ellipse cx="74" cy="22" rx="16" ry="42" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
          <ellipse cx="74" cy="26" rx="8" ry="30" fill={c.ear} />
        </g>
        <g transform="rotate(12 126 40)">
          <ellipse cx="126" cy="22" rx="16" ry="42" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
          <ellipse cx="126" cy="26" rx="8" ry="30" fill={c.ear} />
        </g>
      </g>
    );
  }
  if (kind === 'cat') {
    return (
      <g className={styles.ears}>
        <path d="M44 66 L52 10 L94 42 Z" fill={c.fur} stroke={c.line} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M54 54 L58 24 L80 42 Z" fill={c.ear} />
        <path d="M156 66 L148 10 L106 42 Z" fill={c.fur} stroke={c.line} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M146 54 L142 24 L120 42 Z" fill={c.ear} />
      </g>
    );
  }
  return (
    <g className={styles.ears}>
      <circle cx="48" cy="44" r="24" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
      <circle cx="48" cy="44" r="12" fill={c.ear} />
      <circle cx="152" cy="44" r="24" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
      <circle cx="152" cy="44" r="12" fill={c.ear} />
    </g>
  );
}

function Eyes({ mood, c }) {
  if (mood === 'happy' || mood === 'love' || mood === 'gift') {
    // ^ ^
    return (
      <g fill="none" stroke={c.ink} strokeWidth="5" strokeLinecap="round">
        <path d="M68 96 Q78 84 88 96" />
        <path d="M112 96 Q122 84 132 96" />
      </g>
    );
  }
  if (mood === 'sleep') {
    // u u
    return (
      <g fill="none" stroke={c.ink} strokeWidth="4.5" strokeLinecap="round">
        <path d="M68 92 Q78 101 88 92" />
        <path d="M112 92 Q122 101 132 92" />
      </g>
    );
  }
  return (
    <g className={styles.eyes}>
      {mood === 'sad' && (
        <g stroke={c.ink} strokeWidth="3.5" strokeLinecap="round">
          <path d="M68 76 L86 80" />
          <path d="M132 76 L114 80" />
        </g>
      )}
      <g className={styles.eye}>
        <ellipse cx="78" cy="94" rx="8.5" ry="10" fill={c.ink} />
        <circle cx="81" cy="90" r="3" fill="#fff" />
      </g>
      <g className={styles.eye}>
        <ellipse cx="122" cy="94" rx="8.5" ry="10" fill={c.ink} />
        <circle cx="125" cy="90" r="3" fill="#fff" />
      </g>
      {mood === 'sad' && <path className={styles.tear} d="M132 104 q5 9 0 13 q-5 -4 0 -13 Z" fill="#8fd3ff" />}
    </g>
  );
}

function Muzzle({ kind, mood, c }) {
  const open = mood === 'happy' || mood === 'love' || mood === 'gift';
  const mouth = mood === 'sad'
    ? <path d="M90 124 Q100 114 110 124" fill="none" stroke={c.ink} strokeWidth="3.5" strokeLinecap="round" />
    : open
      ? (
        <g>
          <path d="M88 114 Q100 134 112 114 Z" fill="#7a2e3b" stroke={c.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M94 122 Q100 130 106 122 Q100 118 94 122 Z" fill="#ff8fa3" />
        </g>
      )
      : <path d="M90 114 Q95 121 100 114 Q105 121 110 114" fill="none" stroke={c.ink} strokeWidth="3.5" strokeLinecap="round" />;
  return (
    <g>
      {kind === 'bear' && <ellipse cx="100" cy="112" rx="22" ry="16" fill={c.belly} />}
      {kind === 'cat' ? (
        <path d="M94 104 L106 104 L100 111 Z" fill={c.nose} stroke={c.ink} strokeWidth="1.5" strokeLinejoin="round" />
      ) : (
        <ellipse cx="100" cy="106" rx={kind === 'bear' ? 7 : 5} ry={kind === 'bear' ? 5 : 4} fill={c.nose} />
      )}
      {mouth}
      {kind === 'cat' && (
        <g stroke={c.ink} strokeWidth="2" strokeLinecap="round" opacity="0.55">
          <path d="M58 106 L34 100" /><path d="M58 112 L34 114" />
          <path d="M142 106 L166 100" /><path d="M142 112 L166 114" />
        </g>
      )}
    </g>
  );
}

/**
 * The little friend who greets her: a bear, a bunny or a cat, drawn in SVG.
 *
 * `mood`: 'idle' (breathes, blinks), 'cover' (paws over the eyes while she
 * types the password), 'peek' (peeking through), 'sad' (wrong password),
 * 'happy' (hops), 'love' (hearts), 'sleep' (not the day yet), 'gift'
 * (holding the present).
 */
export default function Mascot({ kind = 'bear', mood = 'idle', size = 200, label, className }) {
  const c = PALETTES[kind] ?? PALETTES.bear;
  const pawsUp = mood === 'cover' || mood === 'peek';
  // The bunny's ears reach above the head: room for them inside the box
  const top = kind === 'bunny' ? -26 : 0;
  return (
    <svg
      className={clsx(styles.mascot, styles[mood], className)}
      viewBox={`0 ${top} 200 ${230 - top}`}
      width={size}
      height={(size * (230 - top)) / 200}
      // Without a label it is decoration next to its name
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: 'false' })}
    >
      {(mood === 'love' || mood === 'happy' || mood === 'gift') && (
        <g className={styles.hearts} fill="#ff6b8b">
          <path d="M30 40 c0 -6 8 -8 10 -2 c2 -6 10 -4 10 2 c0 6 -10 12 -10 12 c0 0 -10 -6 -10 -12 Z" />
          <path d="M160 26 c0 -5 6 -6 8 -1 c2 -5 8 -4 8 1 c0 5 -8 10 -8 10 c0 0 -8 -5 -8 -10 Z" />
          <path d="M172 76 c0 -4 5 -5 6 -1 c1 -4 6 -3 6 1 c0 4 -6 8 -6 8 c0 0 -6 -4 -6 -8 Z" />
        </g>
      )}
      {mood === 'sleep' && (
        <g className={styles.zzz} fill={c.ink} fontWeight="800" fontFamily="system-ui, sans-serif">
          <text x="150" y="40" fontSize="18">z</text>
          <text x="164" y="24" fontSize="14">z</text>
          <text x="176" y="10" fontSize="11">z</text>
        </g>
      )}
      <g className={styles.body}>
        {/* Feet and body */}
        <ellipse cx="72" cy="216" rx="20" ry="11" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
        <ellipse cx="128" cy="216" rx="20" ry="11" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
        <ellipse cx="100" cy="176" rx="58" ry="44" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
        <ellipse cx="100" cy="184" rx="34" ry="28" fill={c.belly} />
        {kind === 'bunny' && <circle cx="152" cy="196" r="10" fill="#fff" stroke={c.line} strokeWidth="2" />}
        {mood === 'gift' && (
          <g className={styles.present}>
            <rect x="72" y="164" width="56" height="44" rx="6" fill="#ff6b8b" stroke="#d94a6a" strokeWidth="2.5" />
            <rect x="94" y="164" width="12" height="44" fill="#ffd166" />
            <rect x="66" y="156" width="68" height="14" rx="4" fill="#ff8fab" stroke="#d94a6a" strokeWidth="2.5" />
            <path d="M100 156 C86 136 72 150 100 156 C128 150 114 136 100 156 Z" fill="#ffd166" stroke="#e0a800" strokeWidth="2" />
          </g>
        )}
        {/* The head, which shakes when she gets it wrong */}
        <g className={styles.head}>
          <Ears kind={kind} c={c} />
          <circle cx="100" cy="94" r="62" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
          {kind === 'cat' && (
            <g fill="none" stroke={c.line} strokeWidth="4" strokeLinecap="round">
              <path d="M90 38 Q92 48 90 56" /><path d="M100 34 Q100 46 100 56" /><path d="M110 38 Q108 48 110 56" />
            </g>
          )}
          <ellipse cx="62" cy="112" rx="11" ry="7" fill="#ff9fb4" opacity="0.6" />
          <ellipse cx="138" cy="112" rx="11" ry="7" fill="#ff9fb4" opacity="0.6" />
          <Eyes mood={mood} c={c} />
          <Muzzle kind={kind} mood={mood} c={c} />
        </g>
        {/* Paws: at the sides, over the eyes while she types, on the present */}
        <g className={clsx(styles.paw, styles.pawLeft, pawsUp && styles.up, mood === 'peek' && styles.peekPaw)}>
          <ellipse cx="50" cy="168" rx="17" ry="14" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
          <circle cx="44" cy="166" r="3" fill={c.ear} /><circle cx="51" cy="162" r="3" fill={c.ear} /><circle cx="58" cy="166" r="3" fill={c.ear} />
        </g>
        <g className={clsx(styles.paw, styles.pawRight, pawsUp && styles.up)}>
          <ellipse cx="150" cy="168" rx="17" ry="14" fill={c.fur} stroke={c.line} strokeWidth="2.5" />
          <circle cx="142" cy="166" r="3" fill={c.ear} /><circle cx="149" cy="162" r="3" fill={c.ear} /><circle cx="156" cy="166" r="3" fill={c.ear} />
        </g>
      </g>
    </svg>
  );
}
