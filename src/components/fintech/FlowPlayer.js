import { useEffect } from 'react';
import clsx from 'clsx';
import { IoArrowForward } from 'react-icons/io5';
import SequenceDiagram from './SequenceDiagram';
import MoneyMap from './MoneyMap';
import PlayerControls from './PlayerControls';
import usePlayer from './usePlayer';
import styles from './Flow.module.scss';

const KIND = {
  call: 'call',
  reply: 'response',
  event: 'event (Kafka)',
  callback: 'callback (HTTP)',
  money: 'chuyển tiền',
};

/**
 * Step-by-step player for one flow: the sequence diagram, a card that
 * explains the current step and the status it leaves the order in, and the
 * money map.
 */
export default function FlowPlayer({ flow, onStatusClick }) {
  const player = usePlayer(flow.steps.length);
  const { index, reset } = player;
  const step = flow.steps[index];
  const prev = index > 0 ? flow.steps[index - 1] : null;
  const statusChanged = !prev || prev.state !== step.state;
  const name = id => flow.participants.find(p => p.id === id)?.label;

  // A new flow starts from its first step
  useEffect(() => {
    reset();
  }, [flow.key, reset]);

  function onKeyDown(event) {
    if (event.target.closest('button')) return;
    if (event.key === 'ArrowRight') { player.next(); event.preventDefault(); }
    if (event.key === 'ArrowLeft') { player.prev(); event.preventDefault(); }
  }

  return (
    <div className={styles.player} tabIndex={0} onKeyDown={onKeyDown} aria-label="Trình phát từng bước, dùng phím ← →">
      <div className={styles.playerMain}>
        <SequenceDiagram flow={flow} index={index} onSelect={player.go} />
      </div>

      <aside className={styles.playerSide}>
        <PlayerControls player={player} total={flow.steps.length} label="Điều khiển sequence" />

        <div key={`${flow.key}-${index}`} className={styles.stepCard}>
          <div className={styles.stepMeta}>
            <span className={styles.stepNo}>Bước {index + 1}</span>
            <span className={clsx(styles.kind, styles[`kind_${step.kind}`])}>{KIND[step.kind]}</span>
          </div>
          <h3 className={styles.stepTitle}>{step.label}</h3>
          <div className={styles.stepRoute}>
            {name(step.from)} <IoArrowForward /> {name(step.to)}
          </div>
          <p className={styles.stepNote}>{step.note}</p>
          <button type="button" className={clsx(styles.status, statusChanged && styles.statusNew)} onClick={() => onStatusClick?.(step.state)}>
            <span className={styles.statusLabel}>{statusChanged ? 'Order chuyển sang' : 'Order vẫn ở'}</span>
            <code>{step.state}</code>
          </button>
        </div>

        <MoneyMap flow={flow} index={index} />
      </aside>
    </div>
  );
}
