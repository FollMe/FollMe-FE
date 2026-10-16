import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { IoAdd, IoBusOutline, IoClose } from 'react-icons/io5';
import { isProgramTime } from 'util/program';
import {
  MAX_SHUTTLES, MAX_SHUTTLE_FROM, MAX_SHUTTLE_LABEL, MAX_SHUTTLE_SEATS, newShuttleRow, shuttleRowError,
} from 'util/shuttles';
import styles from './ShuttleField.module.scss';

/**
 * "Xe đưa đón": the buses the hosts hire for guests, each with when and
 * where it leaves and how many seats. Guests who say they are coming pick
 * one on their card, until it is full.
 */
export default function ShuttleField({ value, onChange, showErrors }) {
  const isFull = value.length >= MAX_SHUTTLES;

  function update(id, patch) {
    onChange(value.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <div className={styles.field}>
      {value.length > 0 && (
        <ol className={styles.rows}>
          {value.map((row, i) => {
            const bad = showErrors && shuttleRowError(row);
            const name = row.label.trim() || `chuyến ${i + 1}`;
            return (
              <li key={row.id}>
                <div className={styles.line}>
                  <TextField
                    className={styles.grow}
                    size="small"
                    label="Tên chuyến xe"
                    placeholder="Xe từ TP.HCM"
                    value={row.label}
                    onChange={e => update(row.id, { label: e.target.value })}
                    inputProps={{ maxLength: MAX_SHUTTLE_LABEL }}
                  />
                  <IconButton size="small" aria-label={`Bỏ ${name}`} onClick={() => onChange(value.filter(r => r.id !== row.id))}>
                    <IoClose />
                  </IconButton>
                </div>
                <div className={styles.line}>
                  <TextField
                    className={styles.time}
                    type="time"
                    size="small"
                    label="Giờ xe chạy"
                    value={row.time}
                    onChange={e => update(row.id, { time: e.target.value })}
                    error={Boolean(bad && !isProgramTime(row.time))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300, 'aria-label': `Giờ xe chạy của ${name}` }}
                  />
                  <TextField
                    className={styles.seats}
                    size="small"
                    label="Số chỗ"
                    value={row.seats}
                    onChange={e => update(row.id, { seats: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    error={Boolean(bad && isProgramTime(row.time))}
                    inputProps={{ inputMode: 'numeric', 'aria-label': `Số chỗ của ${name}` }}
                  />
                  <TextField
                    className={styles.grow}
                    size="small"
                    label="Điểm đón"
                    placeholder="Ngã tư Hàng Xanh, Bình Thạnh"
                    value={row.from}
                    onChange={e => update(row.id, { from: e.target.value })}
                    inputProps={{ maxLength: MAX_SHUTTLE_FROM, 'aria-label': `Điểm đón của ${name}` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {showErrors && value.some(shuttleRowError) && (
        <p className={styles.error}>Mỗi chuyến xe cần giờ chạy và số chỗ (1 đến {MAX_SHUTTLE_SEATS})</p>
      )}
      {!isFull && (
        <Button
          className={styles.add}
          variant="outlined"
          startIcon={value.length ? <IoAdd /> : <IoBusOutline />}
          onClick={() => onChange([...value, newShuttleRow()])}
        >
          {value.length ? 'Thêm chuyến xe' : 'Có xe đưa đón khách'}
        </Button>
      )}
      <p className={styles.help}>
        {isFull
          ? `Tối đa ${MAX_SHUTTLES} chuyến xe.`
          : 'Khách nhận lời chọn xe ngay trên thiệp, xe đủ chỗ thì thôi nhận. Bạn xem và in danh sách từng xe ở trang quản lý thiệp.'}
      </p>
    </div>
  );
}
