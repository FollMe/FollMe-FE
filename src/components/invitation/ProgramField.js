import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { IoAdd, IoClose, IoSparklesOutline } from 'react-icons/io5';
import {
  MAX_PROGRAM_ITEMS, MAX_PROGRAM_LABEL, PROGRAM_LABELS, addMinutes, isProgramTime, suggestProgram,
} from 'util/program';
import styles from './ProgramField.module.scss';

let nextId = 0;
/** Rows of the form carry an id, so React keeps each row's inputs as they move. */
export const toRows = (program = []) => program.map(item => ({ ...item, id: `p${nextId++}` }));

/** A row with a label needs a time; empty rows are left out on save. */
export const programError = rows => rows.some(row => row.label.trim() && !isProgramTime(row.time));

/**
 * The program of the day: a time and what happens, one row each. Starts
 * from a suggestion; common moments are a tap away.
 */
export default function ProgramField({ value, onChange, type, startTime, showErrors }) {
  const used = new Set(value.map(row => row.label.replace(/\s+/g, ' ').trim()));
  const chips = (PROGRAM_LABELS[type] ?? PROGRAM_LABELS.other).filter(label => !used.has(label));
  const isFull = value.length >= MAX_PROGRAM_ITEMS;

  function update(id, patch) {
    onChange(value.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }

  function add(label = '') {
    const times = value.map(row => row.time).filter(isProgramTime).sort();
    const last = times[times.length - 1];
    const time = (last ? addMinutes(last, 30) : startTime) ?? last ?? '';
    onChange([...value, ...toRows([{ time, label }])]);
  }

  return (
    <div className={styles.field}>
      {value.length === 0 ? (
        <Button
          className={styles.suggest}
          variant="outlined"
          startIcon={<IoSparklesOutline />}
          disabled={!startTime}
          onClick={() => onChange(toRows(suggestProgram(type, startTime)))}
        >
          Gợi ý theo giờ tiệc
        </Button>
      ) : (
        <ol className={styles.rows}>
          {value.map((row, i) => {
            const missingTime = showErrors && row.label.trim() && !isProgramTime(row.time);
            return (
              <li key={row.id}>
                <TextField
                  className={styles.time}
                  type="time"
                  label="Giờ"
                  size="small"
                  value={row.time}
                  onChange={e => update(row.id, { time: e.target.value })}
                  error={Boolean(missingTime)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300, 'aria-label': `Giờ của mục ${i + 1}` }}
                />
                <TextField
                  className={styles.label}
                  label="Nội dung"
                  size="small"
                  value={row.label}
                  placeholder="Khai tiệc"
                  onChange={e => update(row.id, { label: e.target.value })}
                  inputProps={{ maxLength: MAX_PROGRAM_LABEL, 'aria-label': `Nội dung mục ${i + 1}` }}
                />
                <IconButton
                  size="small"
                  aria-label={`Bỏ mục ${row.label.trim() || i + 1}`}
                  onClick={() => onChange(value.filter(r => r.id !== row.id))}
                >
                  <IoClose />
                </IconButton>
              </li>
            );
          })}
        </ol>
      )}
      {showErrors && programError(value) && <p className={styles.error}>Nhập giờ cho từng mục</p>}

      {value.length > 0 && !isFull && (
        <div className={styles.more}>
          {chips.slice(0, 5).map(label => (
            <button key={label} type="button" className={styles.chip} onClick={() => add(label)}>
              <IoAdd aria-hidden /> {label}
            </button>
          ))}
          <button type="button" className={styles.chip} onClick={() => add()}>
            <IoAdd aria-hidden /> Mục khác
          </button>
        </div>
      )}
      <p className={styles.help}>
        {isFull
          ? `Tối đa ${MAX_PROGRAM_ITEMS} mục.`
          : 'Thiệp tự sắp theo giờ. Trong ngày tiệc, khách thấy mục đang diễn ra và mục tiếp theo, cả trên màn hình lời chúc.'}
      </p>
    </div>
  );
}
