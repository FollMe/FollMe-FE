import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import { IoChevronBack, IoChevronForward, IoTodayOutline, IoSunnyOutline, IoAlertCircleOutline } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import { setPageMeta } from 'util/meta';
import ZodiacToday from 'components/almanac/ZodiacToday';
import {
  DISCLAIMER, addDays, currentHourBranch, formatHourRange, getAlmanac, lunarMonthLabel, todayInVietnam,
} from 'util/fortune';
import styles from './Almanac.module.scss';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ['Một', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Mười Hai'];

/** Notes for special lunar days. */
function lunarDayNote(lunar) {
  if (lunar.day === 1 && lunar.month === 1 && !lunar.isLeapMonth) {
    return 'Mùng 1 Tết Nguyên Đán — chúc mừng năm mới!';
  }
  if (lunar.day === 15 && lunar.month === 1) {
    return 'Rằm tháng Giêng (Tết Nguyên Tiêu).';
  }
  if (lunar.day === 15 && lunar.month === 7) {
    return 'Rằm tháng Bảy (Vu Lan).';
  }
  if (lunar.day === 15 && lunar.month === 8) {
    return 'Rằm tháng Tám — Tết Trung Thu.';
  }
  if (lunar.day === 1) {
    return 'Mùng 1 âm lịch.';
  }
  if (lunar.day === 15) {
    return 'Ngày rằm.';
  }
  return null;
}

export default function Almanac() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayInVietnam();
  const paramDate = searchParams.get('date');
  const date = paramDate && DATE_RE.test(paramDate) ? paramDate : today;
  const isToday = date === today;
  const [day, setDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const nowBranch = useMemo(() => (isToday ? currentHourBranch() : -1), [isToday]);

  useEffect(() => {
    setPageMeta({
      title: 'Lịch vạn niên & tử vi hôm nay 12 con giáp',
      description: 'Lịch âm hôm nay, ngày hoàng đạo, giờ tốt, tiết khí và tử vi hằng ngày cho 12 con giáp, tính theo lịch Việt Nam.',
    });
  }, []);

  // Deep link from "tử vi hôm nay" entry points
  useEffect(() => {
    if (day && window.location.hash === '#con-giap') {
      document.getElementById('con-giap')?.scrollIntoView({ block: 'start' });
    }
  }, [day]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    getAlmanac(date)
      .then(res => isActive && setDay(res))
      .catch(err => console.log(err))
      .finally(() => isActive && setIsLoading(false));
    return () => {
      isActive = false;
    };
  }, [date]);

  function goTo(next) {
    if (!next || !DATE_RE.test(next)) {
      return;
    }
    if (next === today) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ date: next }, { replace: true });
  }

  const note = day && lunarDayNote(day.lunar);

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Lịch vạn niên"
        title={isToday ? 'Lịch âm hôm nay' : 'Tra cứu lịch âm'}
        description="Ngày âm lịch, can chi, ngày hoàng đạo – hắc đạo, giờ tốt và tiết khí, tính theo lịch Việt Nam (UTC+7)."
      />

      <div className={styles.nav}>
        <IconButton aria-label="Ngày trước" onClick={() => goTo(addDays(date, -1))} className={styles.navBtn}>
          <IoChevronBack />
        </IconButton>
        <input
          type="date"
          className={styles.dateInput}
          value={date}
          min="1900-01-31"
          max="2199-12-31"
          onChange={e => goTo(e.target.value)}
          aria-label="Chọn ngày"
        />
        <IconButton aria-label="Ngày sau" onClick={() => goTo(addDays(date, 1))} className={styles.navBtn}>
          <IoChevronForward />
        </IconButton>
        {!isToday && (
          <Button variant="outlined" size="small" startIcon={<IoTodayOutline />} onClick={() => goTo(today)}>
            Hôm nay
          </Button>
        )}
      </div>

      {isLoading && !day ? (
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: '22px' }} />
      ) : day && (
        <div className={clsx(styles.layout, isLoading && styles.loading)}>
          <section className={styles.sheet} aria-label="Tờ lịch">
            <div className={styles.sheetHead}>
              Tháng {MONTHS[day.solar.month - 1]} · {day.solar.year}
            </div>
            <div className={styles.sheetBody}>
              <div className={styles.solar}>
                <div className={styles.weekday}>{day.weekday}</div>
                <div className={styles.bigDay}>{day.solar.day}</div>
              </div>
              <div className={styles.lunar}>
                <div className={styles.lunarLabel}>Âm lịch</div>
                <div className={styles.lunarDay}>{day.lunar.day}</div>
                <div className={styles.lunarMeta}>
                  {lunarMonthLabel(day.lunar)} ({day.monthName})
                  <br />
                  năm {day.yearName}
                </div>
              </div>
            </div>
            <div className={styles.sheetFoot}>
              <span className={clsx(styles.badge, day.daySpirit.auspicious ? styles.good : styles.bad)}>
                {day.daySpirit.auspicious ? 'Hoàng đạo' : 'Hắc đạo'} · {day.daySpirit.name}
              </span>
              <span className={styles.chip}>Ngày {day.dayName}</span>
              <span className={styles.chip}>{day.dayNapAm}</span>
              <span className={styles.chip}><IoSunnyOutline /> Tiết {day.solarTerm}</span>
            </div>
            {note && <div className={styles.note}>{note}</div>}
          </section>

          <section className={styles.hoursPanel}>
            <h2 className={styles.h2}>Giờ trong ngày</h2>
            <p className={styles.sub}>
              Giờ hoàng đạo (tô màu) thường được chọn để khởi sự việc quan trọng.
            </p>
            <ol className={styles.hours}>
              {day.hours.map((hour, index) => (
                <li
                  key={hour.branch}
                  className={clsx(styles.hour, hour.spirit.auspicious && styles.goodHour, index === nowBranch && styles.now)}
                  title={`${hour.spirit.name} ${hour.spirit.auspicious ? 'hoàng đạo' : 'hắc đạo'}`}
                >
                  <span className={styles.hourName}>{hour.branch}</span>
                  <span className={styles.hourRange}>{formatHourRange(hour)}</span>
                  <span className={styles.hourSpirit}>{hour.spirit.name}</span>
                  {index === nowBranch && <span className={styles.nowTag}>Bây giờ</span>}
                </li>
              ))}
            </ol>

            <div className={styles.clash}>
              <IoAlertCircleOutline />
              <span>
                Ngày {day.dayName} xung với tuổi <strong>{day.clashBranch}</strong>. Người tuổi {day.clashBranch} nên
                cân nhắc kỹ trước khi quyết định việc lớn.
              </span>
            </div>
          </section>
        </div>
      )}

      {day && <ZodiacToday day={day} isToday={isToday} />}

      <p className={styles.disclaimer}>{DISCLAIMER}</p>
    </div>
  );
}
