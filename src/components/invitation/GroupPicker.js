import { useState } from 'react';
import clsx from 'clsx';
import { IoAdd } from 'react-icons/io5';
import { MAX_GROUP_NAME, cleanGroup } from 'util/guestList';
import styles from './GroupPicker.module.scss';

/**
 * One group for a guest, or for guests being added: tap a suggestion, tap
 * it again for none, or type another one. `value` is '' for none.
 */
export default function GroupPicker({ value, onChange, options, label = 'Nhóm' }) {
  const choices = [...new Set([...options, value].filter(Boolean))];
  const [isTyping, setIsTyping] = useState(false);
  const [typed, setTyped] = useState('');

  function addTyped() {
    const group = cleanGroup(typed);
    if (group) {
      onChange(group);
    }
    setTyped('');
    setIsTyping(false);
  }

  return (
    <div className={styles.picker} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      {choices.map(group => (
        <button
          key={group}
          type="button"
          aria-pressed={value === group}
          className={clsx(value === group && styles.on)}
          onClick={() => onChange(value === group ? '' : group)}
        >
          {group}
        </button>
      ))}
      {isTyping ? (
        <input
          autoFocus
          value={typed}
          maxLength={MAX_GROUP_NAME}
          placeholder="Tên nhóm"
          aria-label="Tên nhóm khác"
          onChange={e => setTyped(e.target.value)}
          onBlur={addTyped}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTyped();
            } else if (e.key === 'Escape') {
              e.stopPropagation();
              setTyped('');
              setIsTyping(false);
            }
          }}
        />
      ) : (
        <button type="button" className={styles.other} onClick={() => setIsTyping(true)}>
          <IoAdd aria-hidden /> Nhóm khác
        </button>
      )}
    </div>
  );
}
