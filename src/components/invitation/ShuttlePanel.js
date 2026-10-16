import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { IoBusOutline, IoPrintOutline } from 'react-icons/io5';
import { shuttleRiders, shuttleWhen } from 'util/shuttles';
import styles from './ShuttlePanel.module.scss';

/**
 * "Xe đưa đón" on the host's page: each bus, how full it is and who is on
 * it, with the list to print for whoever rides along.
 */
export default function ShuttlePanel({ event, guests, className }) {
  const buses = useMemo(() => shuttleRiders(event, guests), [event, guests]);
  if (!buses.length) {
    return null;
  }
  const riders = buses.reduce((n, bus) => n + bus.taken, 0);
  return (
    <section id="xe-dua-don" className={className} aria-labelledby="xe-dua-don-title">
      <div className={styles.head}>
        <h2 id="xe-dua-don-title">
          Xe đưa đón <span className={styles.count}>{riders} khách đi xe</span>
        </h2>
        <Button size="small" variant="outlined" startIcon={<IoPrintOutline />} component={Link} to={`/events/${event._id}/xe/in`}>
          In danh sách xe
        </Button>
      </div>
      <ul className={styles.buses}>
        {buses.map(bus => (
          <li key={bus._id} className={styles.bus}>
            <div className={styles.busHead}>
              <IoBusOutline aria-hidden />
              <div>
                <strong>{bus.label}</strong>
                <span>{shuttleWhen(bus)}</span>
              </div>
              <span className={styles.seats}>{bus.taken}/{bus.seats} chỗ{bus.taken >= bus.seats && <small> · đủ</small>}</span>
            </div>
            <div
              className={styles.meter}
              role="progressbar"
              aria-label={`${bus.label}: ${bus.taken} trên ${bus.seats} chỗ`}
              aria-valuemin={0}
              aria-valuemax={bus.seats}
              aria-valuenow={Math.min(bus.taken, bus.seats)}
            >
              <span style={{ width: `${Math.min(100, (bus.taken / bus.seats) * 100)}%` }} />
            </div>
            {bus.riders.length === 0 ? (
              <p className={styles.empty}>Chưa có khách chọn xe này.</p>
            ) : (
              <ol className={styles.riders}>
                {bus.riders.map(r => (
                  <li key={r.id}>
                    {r.name}
                    {r.people > 1 && <span> · {r.people} người</span>}
                    {r.group && <span> · {r.group}</span>}
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
