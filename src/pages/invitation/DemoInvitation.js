import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import InvitationView from 'components/invitation/InvitationView';
import { THEMES } from 'util/invitation';
import { DEMO_WISHES, demoEvent } from 'util/demoInvitation';
import { setPageMeta } from 'util/meta';
import styles from './DemoInvitation.module.scss';

/**
 * A working sample invitation (/thiep-mau/:theme). Answers and wishes stay
 * in the page. With ?embed=1 it renders without the theme bar, for iframes.
 */
export default function DemoInvitation() {
  const { theme: themeParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = THEMES.some(t => t.value === themeParam) ? themeParam : 'blush';
  const embed = searchParams.get('embed') === '1';
  const event = useMemo(() => demoEvent(theme), [theme]);

  useEffect(() => {
    setPageMeta({ title: 'Thiệp cưới mẫu', description: 'Mở thử một tấm thiệp cưới online: phong bì, lịch cưới, bản đồ, xác nhận tham dự và sổ lưu bút.' });
  }, []);

  return (
    <>
      {!embed && (
        <div className={styles.bar}>
          <span className={styles.label}>Thiệp mẫu</span>
          <div className={styles.themes} role="radiogroup" aria-label="Mẫu thiệp">
            {THEMES.map(t => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={t.value === theme}
                className={clsx(styles.theme, styles[t.value], t.value === theme && styles.active)}
                onClick={() => navigate(`/thiep-mau/${t.value}`, { replace: true })}
                title={t.label}
                aria-label={t.label}
              />
            ))}
          </div>
          <Link to="/events/create?type=wedding" className={styles.cta}>Tạo thiệp</Link>
        </div>
      )}
      <InvitationView key={theme} event={event} wishes={DEMO_WISHES} demo />
    </>
  );
}
