import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { IoTrashOutline, IoCalculatorOutline, IoGridOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import PageHeader from 'components/PageHeader';
import OvalLoading from 'components/loading/OvalLoading';
import { encodeShareFragment, formatBirth, fortuneApi } from 'util/fortune';
import styles from './Fortune.module.scss';

const METHOD_LABELS = { numerology: 'Thần số học', tuvi: 'Tử vi' };
const METHOD_PATHS = { numerology: '/fortune/numerology', tuvi: '/fortune/tu-vi' };

function hasHour(profile) {
  return Boolean(profile.birthTime) || (profile.hourBranch !== null && profile.hourBranch !== undefined);
}

export default function Profiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    document.title = 'Hồ sơ lá số | FollMe';
  }, []);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [p, r] = await Promise.all([fortuneApi.listProfiles(), fortuneApi.listReadings()]);
      setProfiles(p ?? []);
      setReadings(r ?? []);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function open(profile, method) {
    navigate(`${METHOD_PATHS[method]}#${encodeShareFragment(profile)}`);
  }

  async function runConfirmed() {
    const action = confirm;
    setConfirm(null);
    try {
      await action.run();
      toast.success(action.done);
      load();
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Thần số học & Tử vi"
        title="Hồ sơ đã lưu"
        description="Hồ sơ ngày sinh của bạn và người thân. Chỉ bạn xem được, và bạn có thể xóa bất cứ lúc nào."
      />

      {isLoading ? <OvalLoading /> : (
        <>
          <section>
            <h2 className={styles.sectionTitle}>Hồ sơ</h2>
            {profiles.length === 0 ? (
              <div className="empty-state">
                Chưa có hồ sơ nào. Hãy xem <Link to="/fortune/numerology">thần số học</Link> hoặc <Link to="/fortune/tu-vi">lá số tử vi</Link> rồi bấm “Lưu hồ sơ”.
              </div>
            ) : (
              <div className={styles.cards}>
                {profiles.map(p => (
                  <div key={p.id} className={styles.card}>
                    <h3 className={styles.cardTitle}>{p.label}</h3>
                    <div className={styles.cardMeta}>
                      {p.fullName && <div>{p.fullName}</div>}
                      <div>{formatBirth(p)} · {p.gender === 'female' ? 'Nữ' : 'Nam'}</div>
                    </div>
                    <div className={styles.cardActions}>
                      <Button size="small" variant="outlined" startIcon={<IoCalculatorOutline />} onClick={() => open(p, 'numerology')}>
                        Thần số học
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<IoGridOutline />}
                        disabled={!hasHour(p)}
                        title={hasHour(p) ? undefined : 'Cần giờ sinh để lập lá số'}
                        onClick={() => open(p, 'tuvi')}
                      >
                        Tử vi
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<IoTrashOutline />}
                        onClick={() => setConfirm({
                          title: `Xóa hồ sơ “${p.label}”?`,
                          text: 'Lịch sử xem của hồ sơ này cũng sẽ bị xóa.',
                          done: 'Đã xóa hồ sơ',
                          run: () => fortuneApi.deleteProfile(p.id),
                        })}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Lịch sử xem</h2>
            {readings.length === 0 ? (
              <div className="empty-state">Chưa có lịch sử.</div>
            ) : (
              <div className={styles.history}>
                {readings.map(r => {
                  const profile = profiles.find(p => p.id === r.profileId);
                  return (
                    <div key={r.id} className={styles.historyItem}>
                      <div>
                        <strong>{METHOD_LABELS[r.method]}</strong> · {r.profileLabel}
                        <div className="muted">{dayjs(r.createdAt).format('DD/MM/YYYY HH:mm')}{r.note ? ` · ${r.note}` : ''}</div>
                      </div>
                      <div className={styles.cardActions}>
                        {profile && (
                          <Button size="small" onClick={() => open(profile, r.method)}>Xem lại</Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setConfirm({
                            title: 'Xóa mục lịch sử này?',
                            done: 'Đã xóa',
                            run: () => fortuneApi.deleteReading(r.id),
                          })}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className={styles.danger}>
            <Button
              color="error"
              variant="outlined"
              startIcon={<IoTrashOutline />}
              onClick={() => setConfirm({
                title: 'Xóa toàn bộ dữ liệu thần số học & tử vi?',
                text: 'Tất cả hồ sơ và lịch sử xem sẽ bị xóa vĩnh viễn.',
                done: 'Đã xóa toàn bộ dữ liệu',
                run: () => fortuneApi.deleteAll(),
              })}
            >
              Xóa toàn bộ dữ liệu
            </Button>
          </div>
        </>
      )}

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm?.title}</DialogTitle>
        {confirm?.text && <DialogContent>{confirm.text}</DialogContent>}
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={runConfirmed}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
