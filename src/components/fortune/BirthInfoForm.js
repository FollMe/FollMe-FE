import { useFormik } from 'formik';
import * as yup from 'yup';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import LoadingButton from '@mui/lab/LoadingButton';
import { IoSparklesOutline } from 'react-icons/io5';
import { HOUR_BRANCHES, parseDateString, toDateString } from 'util/fortune';
import styles from './BirthInfoForm.module.scss';

const CURRENT_YEAR = new Date().getFullYear();
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInSolarMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

/**
 * Birth input used by the numerology and tử vi pages.
 *
 * @param {'numerology'|'tuvi'} mode - tử vi needs gender and birth hour,
 *   numerology uses the full name.
 */
export default function BirthInfoForm({ mode, initialValues, onSubmit, isSubmitting, submitLabel }) {
  const isTuVi = mode === 'tuvi';
  const initialDate = parseDateString(initialValues?.birthDate);

  const validationSchema = yup.object({
    fullName: yup.string().max(100, 'Họ tên tối đa 100 kí tự'),
    day: yup.number().required('Chọn ngày'),
    month: yup.number().required('Chọn tháng'),
    year: yup.number()
      .typeError('Nhập năm sinh')
      .required('Nhập năm sinh')
      .min(1900, 'Năm sinh từ 1900')
      .max(2199, 'Năm sinh không hợp lệ'),
    gender: isTuVi ? yup.string().required('Chọn giới tính') : yup.string(),
    hourMode: yup.string(),
    birthTime: yup.string().when('hourMode', {
      is: 'time',
      then: schema => (isTuVi ? schema.required('Nhập giờ sinh') : schema),
    }),
    hourBranch: yup.string().when('hourMode', {
      is: 'branch',
      then: schema => (isTuVi ? schema.required('Chọn giờ sinh') : schema),
    }),
  });

  const formik = useFormik({
    initialValues: {
      fullName: initialValues?.fullName ?? '',
      calendar: initialValues?.calendar ?? 'solar',
      isLeapMonth: Boolean(initialValues?.isLeapMonth),
      day: initialDate?.day ?? '',
      month: initialDate?.month ?? '',
      year: initialDate?.year ?? '',
      gender: initialValues?.gender ?? '',
      hourMode: initialValues?.hourBranch !== undefined && initialValues?.hourBranch !== null && !initialValues?.birthTime ? 'branch' : 'time',
      birthTime: initialValues?.birthTime ?? '',
      hourBranch: initialValues?.hourBranch ?? '',
    },
    enableReinitialize: true,
    validationSchema,
    validate: values => {
      const errors = {};
      if (values.calendar === 'solar' && values.day && values.month && values.year) {
        if (Number(values.day) > daysInSolarMonth(Number(values.month), Number(values.year))) {
          errors.day = 'Ngày không tồn tại trong tháng này';
        }
      }
      if (values.calendar === 'lunar' && Number(values.day) > 30) {
        errors.day = 'Tháng âm lịch có tối đa 30 ngày';
      }
      return errors;
    },
    onSubmit: values => {
      const birth = {
        fullName: values.fullName.trim(),
        birthDate: toDateString(values.year, values.month, values.day),
        calendar: values.calendar,
        isLeapMonth: values.calendar === 'lunar' && values.isLeapMonth,
        gender: values.gender || undefined,
      };
      if (values.hourMode === 'time' && values.birthTime) {
        birth.birthTime = values.birthTime;
      }
      if (values.hourMode === 'branch' && values.hourBranch !== '') {
        birth.hourBranch = Number(values.hourBranch);
      }
      onSubmit(birth);
    },
  });

  const fieldError = name => formik.touched[name] && formik.errors[name];

  return (
    <form className={styles.form} onSubmit={formik.handleSubmit} noValidate>
      <TextField
        fullWidth
        label={isTuVi ? 'Họ tên (không bắt buộc)' : 'Họ và tên khai sinh'}
        name="fullName"
        value={formik.values.fullName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(fieldError('fullName'))}
        helperText={fieldError('fullName') || (!isTuVi && 'Dùng để tính số sứ mệnh, linh hồn và nhân cách')}
      />

      <div className={styles.row}>
        <span className={styles.label}>Lịch</span>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={formik.values.calendar}
          onChange={(_, value) => value && formik.setFieldValue('calendar', value)}
        >
          <ToggleButton value="solar">Dương lịch</ToggleButton>
          <ToggleButton value="lunar">Âm lịch</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className={styles.dateGrid}>
        <TextField
          select
          label="Ngày"
          name="day"
          value={formik.values.day}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(fieldError('day'))}
          helperText={fieldError('day')}
        >
          {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Tháng"
          name="month"
          value={formik.values.month}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(fieldError('month'))}
          helperText={fieldError('month')}
        >
          {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <TextField
          label="Năm"
          name="year"
          type="number"
          inputProps={{ min: 1900, max: CURRENT_YEAR + 1, inputMode: 'numeric' }}
          value={formik.values.year}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(fieldError('year'))}
          helperText={fieldError('year')}
        />
      </div>

      {formik.values.calendar === 'lunar' && (
        <FormControlLabel
          control={<Checkbox name="isLeapMonth" checked={formik.values.isLeapMonth} onChange={formik.handleChange} />}
          label="Tháng nhuận"
        />
      )}

      {isTuVi && (
        <>
          <div className={styles.row}>
            <span className={styles.label}>Giờ sinh</span>
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={formik.values.hourMode}
              onChange={(_, value) => value && formik.setFieldValue('hourMode', value)}
            >
              <ToggleButton value="time">Giờ chính xác</ToggleButton>
              <ToggleButton value="branch">Theo canh giờ</ToggleButton>
            </ToggleButtonGroup>
          </div>
          {formik.values.hourMode === 'time' ? (
            <TextField
              fullWidth
              type="time"
              label="Giờ sinh"
              name="birthTime"
              InputLabelProps={{ shrink: true }}
              value={formik.values.birthTime}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(fieldError('birthTime'))}
              helperText={fieldError('birthTime') || 'Sinh từ 23:00 được tính là giờ Tý của ngày hôm sau'}
            />
          ) : (
            <TextField
              select
              fullWidth
              label="Canh giờ"
              name="hourBranch"
              value={formik.values.hourBranch}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(fieldError('hourBranch'))}
              helperText={fieldError('hourBranch')}
            >
              {HOUR_BRANCHES.map(h => (
                <MenuItem key={h.value} value={h.value}>Giờ {h.name} ({h.range})</MenuItem>
              ))}
            </TextField>
          )}

          <div className={styles.row}>
            <span className={styles.label}>Giới tính</span>
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={formik.values.gender}
              onChange={(_, value) => value && formik.setFieldValue('gender', value)}
            >
              <ToggleButton value="male">Nam</ToggleButton>
              <ToggleButton value="female">Nữ</ToggleButton>
            </ToggleButtonGroup>
          </div>
          {formik.submitCount > 0 && formik.errors.gender && (
            <div className={styles.error}>{formik.errors.gender}</div>
          )}
        </>
      )}

      <div className={styles.actions}>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          startIcon={<IoSparklesOutline />}
        >
          {submitLabel}
        </LoadingButton>
      </div>
    </form>
  );
}
