import clsx from 'clsx';
import { prefersReducedMotion } from './usePlayer';
import styles from './Flow.module.scss';

const W = 820;
const LANE_LEFT = 90;
const LANE_RIGHT = W - 90;
const HEAD_Y = 14;
const HEAD_H = 40;
const FIRST_ROW = 96;
const ROW = 46;

/**
 * Sequence diagram that plays: steps before the current one are drawn,
 * the current one is drawn in and carries a moving packet (a coin when money
 * moves), later ones are ghosts. Click a row to jump to it.
 */
export default function SequenceDiagram({ flow, index, onSelect }) {
  const lanes = flow.participants;
  const laneX = i => LANE_LEFT + (i * (LANE_RIGHT - LANE_LEFT)) / (lanes.length - 1);
  const xOf = id => laneX(lanes.findIndex(p => p.id === id));
  const height = FIRST_ROW + flow.steps.length * ROW + 10;
  const current = flow.steps[index];
  const active = new Set([current.from, current.to]);
  const animate = !prefersReducedMotion();

  return (
    <div className={styles.seqScroll}>
      <svg
        className={styles.seq}
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={`Sequence diagram: ${flow.title}, bước ${index + 1}: ${current.label}`}
      >
        <defs>
          {['muted', 'active', 'money'].map(k => (
            <marker key={k} id={`seq-arrow-${flow.key}-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className={styles[`arrow_${k}`]} />
            </marker>
          ))}
        </defs>

        {lanes.map((p, i) => (
          <g key={p.id} className={clsx(styles.lane, active.has(p.id) && styles.laneActive)}>
            <line x1={laneX(i)} x2={laneX(i)} y1={HEAD_Y + HEAD_H} y2={height - 6} className={styles.lifeline} />
            <rect x={laneX(i) - 66} y={HEAD_Y} width={132} height={HEAD_H} rx={10} className={styles.laneHead} />
            <text x={laneX(i)} y={HEAD_Y + HEAD_H / 2 + 5} textAnchor="middle" className={styles.laneLabel}>{p.label}</text>
          </g>
        ))}

        {flow.steps.map((s, i) => {
          const y = FIRST_ROW + i * ROW;
          const x1 = xOf(s.from);
          const x2 = xOf(s.to);
          const dir = Math.sign(x2 - x1);
          const tip = x2 - dir * 4;
          const isMoney = Boolean(s.moneyMoves) && s.moneyMoves !== 'hold';
          const phase = i < index ? 'past' : i === index ? 'current' : 'future';
          const marker = phase === 'current' ? (isMoney ? 'money' : 'active') : 'muted';
          const dashed = s.kind === 'reply' || s.kind === 'event' || s.kind === 'callback';
          const path = `M ${x1} ${y} L ${tip} ${y}`;

          return (
            <g
              key={i}
              className={clsx(styles.msg, styles[`msg_${phase}`], isMoney && styles.msgMoney)}
              onClick={() => onSelect(i)}
            >
              <rect x={0} y={y - ROW / 2 - 4} width={W} height={ROW} className={styles.msgHit} />
              <circle cx={22} cy={y - 4} r={11} className={styles.msgNo} />
              <text x={22} y={y} textAnchor="middle" className={styles.msgNoText}>{i + 1}</text>
              <path
                key={phase === 'current' ? `draw-${index}` : 'static'}
                d={path}
                // Solid arrows draw themselves in; a dash pattern would be scaled by pathLength
                pathLength={dashed ? undefined : 1}
                className={clsx(
                  styles.msgLine,
                  dashed && styles.msgDashed,
                  phase === 'current' && animate && (dashed ? styles.fadeIn : styles.drawIn),
                )}
                markerEnd={`url(#seq-arrow-${flow.key}-${marker})`}
              />
              <text x={(x1 + x2) / 2} y={y - 9} textAnchor="middle" className={styles.msgLabel}>
                {s.label}
              </text>
              {phase === 'current' && animate && (
                <g key={`packet-${index}`} className={isMoney ? styles.coin : styles.packet}>
                  {isMoney ? (
                    <>
                      <circle r={9} />
                      <text y={4} textAnchor="middle">₫</text>
                    </>
                  ) : (
                    <circle r={5} />
                  )}
                  <animateMotion dur={isMoney ? '1.6s' : '1.1s'} begin="0.35s" fill="freeze" repeatCount="indefinite" path={path} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
