import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ACTORS } from 'fintech/savingsFund';
import { layoutFlow, nextStates, stateById } from 'util/stateMachine';
import PlayerControls from './PlayerControls';
import usePlayer, { prefersReducedMotion } from './usePlayer';
import styles from './Flow.module.scss';

const ACTOR_KEYS = Object.keys(ACTORS);

/**
 * The state machine of a flow, drawn from its definition, with scenarios
 * that play: a token travels along each transition, visited states and
 * edges stay lit. Click a state to read what is true in it and what the
 * deadline worker does there.
 */
const StateMachineView = forwardRef(function StateMachineView({ flow }, ref) {
  const layout = useMemo(() => layoutFlow(flow), [flow]);
  const [scenarioId, setScenarioId] = useState(flow.scenarios[0].id);
  const scenario = flow.scenarios.find(s => s.id === scenarioId) ?? flow.scenarios[0];
  const player = usePlayer(scenario.path.length, { interval: 2200 });
  const { index, reset } = player;
  const [selected, setSelected] = useState(null);
  const animate = !prefersReducedMotion();

  const path = scenario.path.map(([id]) => id);
  const current = path[index];
  const visited = new Set(path.slice(0, index + 1));
  const visitedEdges = new Set(path.slice(1, index + 1).map((id, i) => `${path[i]}->${id}`));
  const lastEdge = index > 0 ? layout.edges.find(e => e.id === `${path[index - 1]}->${current}`) : null;
  const shown = stateById(flow, selected ?? current);

  // A new flow or scenario starts from its first state
  useEffect(() => {
    setScenarioId(id => (flow.scenarios.some(s => s.id === id) ? id : flow.scenarios[0].id));
  }, [flow]);
  useEffect(() => {
    reset();
    setSelected(null);
  }, [flow.key, scenarioId, reset]);
  // Following the scenario again shows its state, not the last click
  useEffect(() => {
    if (player.playing) setSelected(null);
  }, [player.playing, index]);

  // Lets the sequence player say "show me this status"
  useImperativeHandle(ref, () => ({ select: id => setSelected(id) }), []);

  return (
    <div className={styles.sm}>
      <div className={styles.scenarios} role="radiogroup" aria-label="Scenario">
        {flow.scenarios.map(s => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === scenario.id}
            className={clsx(s.id === scenario.id && styles.on)}
            onClick={() => setScenarioId(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={styles.smLayout}>
        <div className={styles.smCanvas}>
          <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className={styles.smSvg} role="img" aria-label={`State machine: ${flow.title}. Đang ở ${current}`}>
            <defs>
              {['idle', 'lit'].map(k => (
                <marker key={k} id={`sm-arrow-${flow.key}-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" className={styles[`smArrow_${k}`]} />
                </marker>
              ))}
            </defs>

            {layout.edges.map(e => {
              const lit = visitedEdges.has(e.id);
              const hot = selected && (e.from === selected || e.to === selected);
              return (
                <g key={e.id} className={clsx(styles.edge, lit && styles.edgeLit, hot && styles.edgeHot)}>
                  <path d={e.d} markerEnd={`url(#sm-arrow-${flow.key}-${lit || hot ? 'lit' : 'idle'})`} />
                  {(lit || hot) && (
                    <text x={e.labelAt[0]} y={e.labelAt[1]} textAnchor="middle" className={styles.edgeLabel}>{e.label}</text>
                  )}
                </g>
              );
            })}

            {Object.values(layout.nodes).map(n => {
              const kind = n.terminal ? `term_${n.terminal}` : `actor_${n.actor}`;
              return (
                <g
                  key={n.id}
                  className={clsx(
                    styles.node, styles[kind],
                    visited.has(n.id) && styles.nodeVisited,
                    n.id === current && styles.nodeCurrent,
                    n.id === selected && styles.nodeSelected,
                  )}
                  transform={`translate(${n.x - n.w / 2} ${n.y - n.h / 2})`}
                  onClick={() => setSelected(n.id === selected ? null : n.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={n.id}
                  onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSelected(n.id); } }}
                >
                  <rect width={n.w} height={n.h} rx={n.terminal ? n.h / 2 : 10} />
                  <text x={n.w / 2} y={n.h / 2 + 4.5} textAnchor="middle">{n.id}</text>
                </g>
              );
            })}

            {lastEdge && animate && (
              <circle key={`${scenario.id}-${index}`} r={7} className={styles.token}>
                <animateMotion dur="0.9s" fill="freeze" path={lastEdge.d} />
              </circle>
            )}
          </svg>
        </div>

        <aside className={styles.smSide}>
          <PlayerControls player={player} total={path.length} label="Điều khiển scenario" />
          <p key={`${scenario.id}-${index}`} className={styles.scenarioNote}>
            <code>{current}</code> {scenario.path[index][1]}
          </p>

          {shown && (
            <div className={styles.stateCard}>
              <div className={styles.stateCardHead}>
                <code>{shown.id}</code>
                {shown.terminal ? (
                  <span className={clsx(styles.pill, styles[`pill_${shown.terminal}`])}>terminal</span>
                ) : (
                  <span className={clsx(styles.pill, styles[`pillActor_${shown.actor}`])}>chờ: {ACTORS[shown.actor]}</span>
                )}
              </div>
              <dl>
                <dt>Điều gì đang đúng</dt>
                <dd>{shown.meaning}</dd>
                <dt>Tiền ở đâu</dt>
                <dd>{shown.money}</dd>
                {shown.deadline && (
                  <>
                    <dt>Hết deadline, worker làm gì</dt>
                    <dd>{shown.deadline}</dd>
                  </>
                )}
              </dl>
              {nextStates(flow, shown.id).length > 0 && (
                <div className={styles.nextList}>
                  <span>Đi tiếp được tới</span>
                  {nextStates(flow, shown.id).map(id => (
                    <button key={id} type="button" onClick={() => setSelected(id)}><code>{id}</code></button>
                  ))}
                </div>
              )}
              {selected && selected !== current && (
                <button type="button" className={styles.backToScenario} onClick={() => setSelected(null)}>
                  ← Quay về state của scenario
                </button>
              )}
            </div>
          )}

          <ul className={styles.legend} aria-label="Chú thích màu">
            {ACTOR_KEYS.filter(k => flow.states.some(s => s.actor === k)).map(k => (
              <li key={k}><i className={styles[`actor_${k}`]} /> chờ {ACTORS[k]}</li>
            ))}
            <li><i className={styles.term_ok} /> terminal: thành công</li>
            <li><i className={styles.term_fail} /> terminal: fail</li>
          </ul>
        </aside>
      </div>
    </div>
  );
});

export default StateMachineView;
