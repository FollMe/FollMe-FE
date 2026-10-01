import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { toast } from 'react-toastify';
import { IoCalendarOutline, IoCheckmarkCircle, IoAlertCircleOutline, IoTimeOutline, IoArrowForward, IoWarningOutline } from 'react-icons/io5';
import ArticleHeader from 'components/article/ArticleHeader';
import PersonInput, { EMPTY_PERSON } from 'components/fortune/PersonInput';
import { DISCLAIMER, addDays, fortuneApi, parseDateString, todayInVietnam } from 'util/fortune';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './ChooseDate.module.scss';

const RANGES = [
  { months: 3, label: '3 tháng' },
  { months: 6, label: '6 tháng' },
  { months: 12, label: '12 tháng' },
];

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}

function createLink(day, groom, bride) {
  const params = new URLSearchParams({ type: 'wedding', date: day.date });
  if (groom.name) params.set('groom', groom.name);
  if (bride.name) params.set('bride', bride.name);
  return `/events/create?${params.toString()}`;
}

export default function ChooseDate() {
  const location = useLocation();
  const today = todayInVietnam();
  const [groom, setGroom] = useState(location.state?.groom ?? EMPTY_PERSON);
  const [bride, setBride] = useState(location.state?.bride ?? EMPTY_PERSON);
  const [from, setFrom] = useState(addDays(today, 7));
  const [months, setMonths] = useState(6);
  const [weekendsOnly, setWeekendsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Chọn ngày cưới đẹp theo tuổi',
      description: 'Nhập ngày sinh cô dâu chú rể để tìm ngày cưới hoàng đạo, không xung tuổi, tránh tháng cô hồn, Tam Nương, Nguyệt Kỵ, kèm giờ tốt và cảnh báo Kim Lâu.',
    });
  }, []);

  async function search(event) {
    event?.preventDefault();
    if (!parseDateString(groom.birthDate) || !parseDateString(bride.birthDate)) {
      toast.error('Vui lòng nhập ngày sinh của cô dâu và chú rể');
      return;
    }
    const [y, m, d] = from.split('-').map(Number);
    const end = new Date(y, m - 1 + months, d - 1);
    const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setIsLoading(true);
    try {
      const res = await fortuneApi.weddingDates({ groom, bride, from, to });
      setResult(res);
      track('wedding_dates_searched', { months, found: res.days.length });
      setTimeout(() => document.getElementById('ket-qua')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }

  const days = useMemo(() => {
    if (!result) {
      return [];
    }
    const list = weekendsOnly ? result.days.filter(d => d.isWeekend) : [...result.days];
    if (sortBy === 'score') {
      list.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
    }
    return list;
  }, [result, weekendsOnly, sortBy]);

  const kimLauHits = result?.kimLau.filter(k => k.hit) ?? [];
  const skipped = result?.skipped;

  return (
    <div className="container page">
      <ArticleHeader
        back={{ to: '/cuoi-hoi', label: 'Cưới hỏi' }}
        eyebrow="Chọn ngày cưới"
        title="Tìm ngày cưới đẹp cho hai bạn"
        subtitle="Nhập ngày sinh cô dâu, chú rể và khoảng thời gian dự định. FollMe lọc ra các ngày hoàng đạo, không xung tuổi, tránh tháng cô hồn, Tam Nương và Nguyệt Kỵ, rồi xếp hạng theo độ hợp với hai bạn."
      />

      <form className={styles.form} onSubmit={search}>
        <div className={styles.people}>
          <PersonInput label="Chú rể" nameLabel="Tên chú rể" value={groom} onChange={setGroom} />
          <PersonInput label="Cô dâu" nameLabel="Tên cô dâu" value={bride} onChange={setBride} />
        </div>
        <div className={styles.range}>
          <TextField
            label="Tìm từ ngày"
            type="date"
            size="small"
            value={from}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: '1900-01-31', max: '2199-01-01' }}
            onChange={e => e.target.value && setFrom(e.target.value)}
          />
          <ToggleButtonGroup size="small" exclusive value={months} onChange={(_, v) => v && setMonths(v)} aria-label="Trong vòng">
            {RANGES.map(r => <ToggleButton key={r.months} value={r.months}>{r.label}</ToggleButton>)}
          </ToggleButtonGroup>
          <LoadingButton type="submit" variant="contained" size="large" loading={isLoading} startIcon={<IoCalendarOutline />}>
            Tìm ngày đẹp
          </LoadingButton>
        </div>
      </form>

      {result && (
        <section id="ket-qua" className={styles.result}>
          {kimLauHits.length > 0 ? (
            kimLauHits.map(k => (
              <div key={k.lunarYear} className={clsx(styles.notice, styles.warn)}>
                <IoWarningOutline />
                <p>{k.text}</p>
              </div>
            ))
          ) : (
            <div className={clsx(styles.notice, styles.ok)}>
              <IoCheckmarkCircle />
              <p>{result.kimLau.map(k => k.text).join(' ')}</p>
            </div>
          )}

          <div className={styles.toolbar}>
            <p className={styles.summary}>
              Đã xét <strong>{result.considered}</strong> ngày, còn <strong>{result.days.length}</strong> ngày đẹp.
              {' '}Đã loại {skipped.blackDay} ngày hắc đạo, {skipped.clash} ngày xung tuổi, {skipped.ghostMonth} ngày tháng cô hồn,
              {' '}{skipped.tamNuong + skipped.nguyetKy} ngày Tam Nương, Nguyệt Kỵ{skipped.tet ? `, ${skipped.tet} ngày Tết` : ''}.
            </p>
            <div className={styles.filters}>
              <FormControlLabel
                control={<Switch checked={weekendsOnly} onChange={e => setWeekendsOnly(e.target.checked)} />}
                label="Chỉ cuối tuần"
              />
              <ToggleButtonGroup size="small" exclusive value={sortBy} onChange={(_, v) => v && setSortBy(v)} aria-label="Sắp xếp">
                <ToggleButton value="date">Theo ngày</ToggleButton>
                <ToggleButton value="score">Điểm cao nhất</ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>

          {days.length === 0 ? (
            <div className="empty-state">Không có ngày phù hợp trong khoảng này. Hãy thử mở rộng thời gian tìm.</div>
          ) : (
            <ol className={styles.days}>
              {days.map(day => (
                <li key={day.date} className={styles.day}>
                  <div className={styles.dayDate}>
                    <span className={styles.weekday}>{day.weekday}</span>
                    <strong>{formatDate(day.date)}</strong>
                    <span className={styles.lunar}>Âm lịch {day.lunar}</span>
                  </div>
                  <div className={styles.dayBody}>
                    <div className={styles.dayHead}>
                      <span className={styles.dayName}>Ngày {day.dayName}</span>
                      <span className={clsx(styles.score, day.score >= 9 && styles.top)}>{day.score}/10</span>
                    </div>
                    <ul className={styles.reasons}>
                      {day.reasons.map(r => <li key={r}><IoCheckmarkCircle /> {r}</li>)}
                      {day.warnings.map(w => <li key={w} className={styles.warning}><IoAlertCircleOutline /> {w}</li>)}
                    </ul>
                    <div className={styles.dayFoot}>
                      <span><IoTimeOutline /> Giờ tốt: {day.goodHours.join(', ')}</span>
                      <Button
                        component={Link}
                        to={createLink(day, groom, bride)}
                        size="small"
                        endIcon={<IoArrowForward />}
                        onClick={() => track('wedding_date_to_invite')}
                      >
                        Tạo thiệp cho ngày này
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className={styles.disclaimer}>
            Ngày được lọc theo những quy tắc phổ biến nhất; mỗi vùng và mỗi gia đình có thể xem thêm các yếu tố khác. {DISCLAIMER}
          </p>
        </section>
      )}
    </div>
  );
}
