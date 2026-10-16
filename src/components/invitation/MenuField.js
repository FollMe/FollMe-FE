import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { IoAdd, IoArrowDown, IoArrowUp, IoClose, IoSparklesOutline } from 'react-icons/io5';
import { MAX_MENU_ITEM, MAX_MENU_ITEMS, SUGGESTED_MENU, toMenuRows } from 'util/menu';
import { moveRow } from 'util/story';
import styles from './MenuField.module.scss';

/**
 * "Thực đơn": the dishes in serving order. Starts from a usual wedding
 * menu if the host likes; shown on the card around the day and printed
 * as cards for the tables.
 */
export default function MenuField({ value, onChange }) {
  const isFull = value.length >= MAX_MENU_ITEMS;

  function update(id, dish) {
    onChange(value.map(row => (row.id === id ? { ...row, dish } : row)));
  }

  return (
    <div className={styles.field}>
      {value.length === 0 ? (
        <Button className={styles.start} variant="outlined" startIcon={<IoSparklesOutline />} onClick={() => onChange(toMenuRows(SUGGESTED_MENU))}>
          Bắt đầu từ thực đơn gợi ý
        </Button>
      ) : (
        <ol className={styles.rows}>
          {value.map((row, i) => (
            <li key={row.id}>
              <span className={styles.number} aria-hidden>{i + 1}</span>
              <TextField
                className={styles.dish}
                size="small"
                value={row.dish}
                placeholder="Tên món"
                onChange={e => update(row.id, e.target.value)}
                inputProps={{ maxLength: MAX_MENU_ITEM, 'aria-label': `Món ${i + 1}` }}
              />
              <IconButton size="small" aria-label={`Đưa món ${i + 1} lên`} disabled={i === 0} onClick={() => onChange(moveRow(value, i, -1))}>
                <IoArrowUp />
              </IconButton>
              <IconButton size="small" aria-label={`Đưa món ${i + 1} xuống`} disabled={i === value.length - 1} onClick={() => onChange(moveRow(value, i, 1))}>
                <IoArrowDown />
              </IconButton>
              <IconButton size="small" aria-label={`Bỏ món ${i + 1}`} onClick={() => onChange(value.filter(r => r.id !== row.id))}>
                <IoClose />
              </IconButton>
            </li>
          ))}
        </ol>
      )}
      {value.length > 0 && !isFull && (
        <Button className={styles.start} size="small" startIcon={<IoAdd />} onClick={() => onChange([...value, ...toMenuRows([''])])}>
          Thêm món
        </Button>
      )}
      <p className={styles.help}>
        {isFull
          ? `Tối đa ${MAX_MENU_ITEMS} món.`
          : 'Thiệp hiện thực đơn từ hôm trước tiệc. In thẻ thực đơn đặt lên bàn ở trang quản lý thiệp.'}
      </p>
    </div>
  );
}
