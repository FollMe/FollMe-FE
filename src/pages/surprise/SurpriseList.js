import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import { IoAdd } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import OvalLoading from 'components/loading/OvalLoading';
import Mascot from 'components/surprise/Mascot';
import { vnWallClock } from 'util/date';
import { surpriseApi } from 'util/surprise';
import styles from './Surprise.module.scss';

/** The owner's surprises (/qua-bi-mat). */
export default function SurpriseList() {
  const navigate = useNavigate();
  const [surprises, setSurprises] = useState(null);

  useEffect(() => {
    document.title = 'Hộp quà bí mật | FollMe';
    surpriseApi.list().then(setSurprises).catch(() => setSurprises([]));
  }, []);

  if (!surprises) {
    return <OvalLoading />;
  }
  return (
    <div className="container page">
      <PageHeader
        eyebrow="Sinh nhật người thương"
        title="Hộp quà bí mật"
        description="Một link nhỏ cho người ấy: nhập mật khẩu chỉ hai người biết, thổi nến, đọc thư của bạn rồi tự chọn một món quà. Linh vật dễ thương đi cùng từng bước."
        actions={(
          <Button variant="contained" size="large" startIcon={<IoAdd />} onClick={() => navigate('/qua-bi-mat/tao')}>
            Tạo hộp quà
          </Button>
        )}
      />
      {surprises.length === 0 ? (
        <div className={styles.empty}>
          <Mascot kind="bear" mood="love" size={150} label="Gấu Bông" />
          <p>Chưa có hộp quà nào. Sắp tới sinh nhật ai đó đặc biệt?</p>
          <Button variant="contained" onClick={() => navigate('/qua-bi-mat/tao')}>Tạo hộp quà đầu tiên 🎁</Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {surprises.map(s => (
            <li key={s._id}>
              <Link to={`/qua-bi-mat/${s._id}`} className={styles.item}>
                <Mascot kind={s.mascot} mood={s.pick ? 'gift' : 'idle'} size={64} label="" />
                <div>
                  <strong>Cho {s.recipientName}</strong>
                  <span>
                    {s.pick
                      ? `Đã chọn ${s.pick.emoji ?? ''} ${s.pick.title}`
                      : s.opensAt && new Date(s.opensAt) > new Date()
                        ? `Mở lúc ${dayjs(vnWallClock(s.opensAt)).format('HH:mm DD/MM')}`
                        : `Chưa chọn · ${s.gifts} món`}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
