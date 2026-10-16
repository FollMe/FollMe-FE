import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { IoAdd, IoArrowDown, IoArrowUp, IoClose } from 'react-icons/io5';
import {
  MAX_STORY_ITEMS, MAX_STORY_TEXT, MAX_STORY_TITLE, MAX_STORY_WHEN, STORY_PROMPTS, moveRow, toStoryRows,
} from 'util/story';
import styles from './StoryField.module.scss';

/**
 * The couple's story, a few moments in their order: when ("Mùa thu
 * 2019"), a title and a few lines. Common moments are a tap away.
 */
export default function StoryField({ value, onChange }) {
  const used = new Set(value.map(row => row.title.replace(/\s+/g, ' ').trim()));
  const prompts = STORY_PROMPTS.filter(title => !used.has(title));
  const isFull = value.length >= MAX_STORY_ITEMS;

  function update(id, patch) {
    onChange(value.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <div className={styles.field}>
      {value.length > 0 && (
        <ol className={styles.rows}>
          {value.map((row, i) => (
            <li key={row.id} className={styles.row}>
              <div className={styles.head}>
                <TextField
                  className={styles.when}
                  size="small"
                  label="Khi nào"
                  placeholder="Mùa thu 2019"
                  value={row.when}
                  onChange={e => update(row.id, { when: e.target.value })}
                  inputProps={{ maxLength: MAX_STORY_WHEN, 'aria-label': `Thời gian của khoảnh khắc ${i + 1}` }}
                />
                <TextField
                  className={styles.title}
                  size="small"
                  label="Khoảnh khắc"
                  value={row.title}
                  onChange={e => update(row.id, { title: e.target.value })}
                  inputProps={{ maxLength: MAX_STORY_TITLE, 'aria-label': `Tên khoảnh khắc ${i + 1}` }}
                />
              </div>
              <TextField
                size="small"
                multiline
                minRows={2}
                label="Kể vài dòng (không bắt buộc)"
                value={row.text}
                onChange={e => update(row.id, { text: e.target.value })}
                inputProps={{ maxLength: MAX_STORY_TEXT, 'aria-label': `Lời kể khoảnh khắc ${i + 1}` }}
              />
              <div className={styles.tools}>
                <IconButton size="small" aria-label={`Đưa "${row.title || i + 1}" lên`} disabled={i === 0} onClick={() => onChange(moveRow(value, i, -1))}>
                  <IoArrowUp />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={`Đưa "${row.title || i + 1}" xuống`}
                  disabled={i === value.length - 1}
                  onClick={() => onChange(moveRow(value, i, 1))}
                >
                  <IoArrowDown />
                </IconButton>
                <IconButton size="small" aria-label={`Bỏ "${row.title || i + 1}"`} onClick={() => onChange(value.filter(r => r.id !== row.id))}>
                  <IoClose />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
      {!isFull && (
        <div className={styles.more}>
          {prompts.map(title => (
            <button key={title} type="button" className={styles.chip} onClick={() => onChange([...value, ...toStoryRows([{ title }])])}>
              <IoAdd aria-hidden /> {title}
            </button>
          ))}
          <button type="button" className={styles.chip} onClick={() => onChange([...value, ...toStoryRows([{ title: '' }])])}>
            <IoAdd aria-hidden /> Khoảnh khắc khác
          </button>
        </div>
      )}
      <p className={styles.help}>
        {isFull
          ? `Tối đa ${MAX_STORY_ITEMS} khoảnh khắc.`
          : 'Thiệp có thêm mục "Chuyện chúng mình" theo đúng thứ tự này. Để trống thì không hiện.'}
      </p>
    </div>
  );
}
