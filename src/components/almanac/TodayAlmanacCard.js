import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Skeleton from '@mui/material/Skeleton';
import { IoArrowForward, IoCalendarOutline } from 'react-icons/io5';
import { getAlmanac, lunarMonthLabel } from 'util/fortune';
import styles from './TodayAlmanacCard.module.scss';

/**
 * A small "Hôm nay" page of the lunar calendar, linking to the full
 * almanac. Renders nothing if the almanac cannot be loaded.
 */
export default function TodayAlmanacCard({ className }) {
  const [day, setDay] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isActive = true;
    getAlmanac()
      .then(res => isActive && setDay(res))
      .catch(() => isActive && setFailed(true));
    return () => {
      isActive = false;
    };
  }, []);

  if (failed) {
    return null;
  }

  if (!day) {
    return (
      <div className={clsx(styles.card, className)}>
        <Skeleton variant="rounded" width={88} height={96} />
        <div className={styles.body}>
          <Skeleton width="60%" height={28} />
          <Skeleton width="85%" />
          <Skeleton width="70%" />
        </div>
      </div>
    );
  }

  const goodHours = day.hours.filter(h => h.spirit.auspicious).map(h => h.branch);

  return (
    <Link to="/fortune/lich" className={clsx(styles.card, className)}>
      <div className={styles.sheet} aria-hidden>
        <span className={styles.sheetTop}>{day.weekday}</span>
        <span className={styles.sheetDay}>{day.solar.day}</span>
        <span className={styles.sheetLunar}>{day.lunar.day}/{day.lunar.month} ÂL</span>
      </div>
      <div className={styles.body}>
        <div className={styles.eyebrow}><IoCalendarOutline /> Hôm nay</div>
        <div className={styles.title}>
          {day.weekday}, {day.solar.day}/{day.solar.month}/{day.solar.year}
        </div>
        <p className={styles.line}>
          Âm lịch: ngày {day.lunar.day} {lunarMonthLabel(day.lunar)} năm {day.yearName}
        </p>
        <p className={styles.line}>
          Ngày {day.dayName} ·{' '}
          <span className={clsx(styles.spirit, day.daySpirit.auspicious && styles.good)}>
            {day.daySpirit.name} {day.daySpirit.auspicious ? 'hoàng đạo' : 'hắc đạo'}
          </span>
        </p>
        <p className={styles.line}>Giờ tốt: {goodHours.join(', ')}</p>
        <span className={styles.cta}>Xem lịch vạn niên <IoArrowForward /></span>
      </div>
    </Link>
  );
}
