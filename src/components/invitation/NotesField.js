import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { IoAdd, IoArrowDown, IoArrowUp, IoClose } from 'react-icons/io5';
import { MAX_NOTES, MAX_NOTE_TEXT, MAX_NOTE_TITLE, NOTE_KINDS, newNoteRow, noteKind } from 'util/notes';
import { moveRow } from 'util/story';
import styles from './StoryField.module.scss';

/**
 * "Lưu ý cho khách": a few lines per topic (what to wear, where to park,
 * kids, a place to stay) or the host's own, in the order guests read them.
 */
export default function NotesField({ value, onChange }) {
  const used = new Set(value.map(row => row.kind));
  const topics = NOTE_KINDS.filter(k => k.kind === 'other' || !used.has(k.kind));
  const isFull = value.length >= MAX_NOTES;

  function update(id, patch) {
    onChange(value.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <div className={styles.field}>
      {value.length > 0 && (
        <ol className={styles.rows}>
          {value.map((row, i) => {
            const topic = noteKind(row.kind);
            const name = row.kind === 'other' ? (row.title.trim() || `lưu ý ${i + 1}`) : topic.label;
            return (
              <li key={row.id} className={styles.row}>
                {row.kind === 'other' ? (
                  <TextField
                    size="small"
                    label="Tiêu đề"
                    placeholder="Chụp ảnh, Quà mừng…"
                    value={row.title}
                    onChange={e => update(row.id, { title: e.target.value })}
                    inputProps={{ maxLength: MAX_NOTE_TITLE, 'aria-label': `Tiêu đề lưu ý ${i + 1}` }}
                  />
                ) : (
                  <strong>{topic.label}</strong>
                )}
                <TextField
                  size="small"
                  multiline
                  minRows={2}
                  label="Nội dung"
                  placeholder={topic.placeholder}
                  value={row.text}
                  onChange={e => update(row.id, { text: e.target.value })}
                  inputProps={{ maxLength: MAX_NOTE_TEXT, 'aria-label': `Nội dung: ${name}` }}
                />
                <div className={styles.tools}>
                  <IconButton size="small" aria-label={`Đưa "${name}" lên`} disabled={i === 0} onClick={() => onChange(moveRow(value, i, -1))}>
                    <IoArrowUp />
                  </IconButton>
                  <IconButton size="small" aria-label={`Đưa "${name}" xuống`} disabled={i === value.length - 1} onClick={() => onChange(moveRow(value, i, 1))}>
                    <IoArrowDown />
                  </IconButton>
                  <IconButton size="small" aria-label={`Bỏ "${name}"`} onClick={() => onChange(value.filter(r => r.id !== row.id))}>
                    <IoClose />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {!isFull && (
        <div className={styles.more}>
          {topics.map(topic => (
            <button key={topic.kind} type="button" className={styles.chip} onClick={() => onChange([...value, newNoteRow(topic.kind)])}>
              <IoAdd aria-hidden /> {topic.label}
            </button>
          ))}
        </div>
      )}
      <p className={styles.help}>
        {isFull ? `Tối đa ${MAX_NOTES} lưu ý.` : 'Thiệp có mục "Lưu ý nhỏ" ngay dưới địa điểm. Lưu ý để trống sẽ không hiện.'}
      </p>
    </div>
  );
}
