import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import styles from './PersonInput.module.scss';

export const EMPTY_PERSON = { name: '', birthDate: '', calendar: 'solar', isLeapMonth: false };

/** Name + birth date (solar or lunar) of one person. */
export default function PersonInput({ label, value, onChange, nameLabel = 'Tên (không bắt buộc)' }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <fieldset className={styles.person}>
      <legend>{label}</legend>
      <TextField
        label={nameLabel}
        size="small"
        fullWidth
        value={value.name}
        inputProps={{ maxLength: 50 }}
        onChange={e => set({ name: e.target.value })}
      />
      <TextField
        label="Ngày sinh"
        type="date"
        size="small"
        fullWidth
        required
        value={value.birthDate}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: '1900-01-31', max: '2199-12-31' }}
        onChange={e => set({ birthDate: e.target.value })}
      />
      <div className={styles.calendarRow}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={value.calendar}
          onChange={(_, calendar) => calendar && set({ calendar, isLeapMonth: calendar === 'lunar' && value.isLeapMonth })}
          aria-label="Loại lịch"
        >
          <ToggleButton value="solar">Dương lịch</ToggleButton>
          <ToggleButton value="lunar">Âm lịch</ToggleButton>
        </ToggleButtonGroup>
        {value.calendar === 'lunar' && (
          <FormControlLabel
            control={<Checkbox size="small" checked={value.isLeapMonth} onChange={e => set({ isLeapMonth: e.target.checked })} />}
            label="Tháng nhuận"
          />
        )}
      </div>
    </fieldset>
  );
}
