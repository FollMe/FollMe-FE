import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import QRCode from 'react-qr-code';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import {
  IoCopyOutline, IoShareSocialOutline, IoOpenOutline, IoCreateOutline, IoTrashOutline, IoRefreshOutline, IoArrowBack,
} from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import Mascot from 'components/surprise/Mascot';
import { vnWallClock } from 'util/date';
import { mascotOf, surpriseApi, surpriseUrl } from 'util/surprise';
import styles from './Surprise.module.scss';

const POLL_MS = 20000;

/** One surprise for its owner: the link to send, and what they picked. */
export default function SurpriseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [surprise, setSurprise] = useState(null);

  const load = useCallback(opts => surpriseApi.get(id, opts).then(s => {
    document.title = `Hộp quà cho ${s.recipientName} | FollMe`;
    setSurprise(s);
  }), [id]);

  useEffect(() => {
    load().catch(() => navigate('/qua-bi-mat'));
  }, [load, navigate]);

  // Waiting for their pick: the page catches up on its own (a missed check is no reason to leave)
  const isLoaded = Boolean(surprise);
  const picked = Boolean(surprise?.pick);
  useEffect(() => {
    if (!isLoaded || picked) {
      return undefined;
    }
    const timer = setInterval(() => !document.hidden && load({ quiet: true }).catch(() => {}), POLL_MS);
    return () => clearInterval(timer);
  }, [isLoaded, picked, load]);

  if (!surprise) {
    return <OvalLoading />;
  }

  const url = surpriseUrl(surprise._id);
  const friend = mascotOf(surprise.mascot);
  const pick = surprise.pick;
  const opensLater = surprise.opensAt && new Date(surprise.opensAt) > new Date();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã copy link');
    } catch (err) {
      console.log(err);
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Một món quà cho ${surprise.recipientName} 🎁`, url });
        return;
      }
      await copy();
    } catch (err) {
      // Closed the share sheet
    }
  }

  async function reopen() {
    if (!window.confirm(`Cho ${surprise.recipientName} chọn lại quà?`)) {
      return;
    }
    try {
      await surpriseApi.reopen(surprise._id);
      setSurprise(s => ({ ...s, pick: undefined }));
    } catch (err) {
      console.log(err);
    }
  }

  async function remove() {
    if (!window.confirm('Xoá hộp quà này? Link sẽ không mở được nữa.')) {
      return;
    }
    try {
      await surpriseApi.remove(surprise._id);
      navigate('/qua-bi-mat');
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="container page">
      <Button component={Link} to="/qua-bi-mat" startIcon={<IoArrowBack />} sx={{ mb: 1 }}>Hộp quà bí mật</Button>
      <header className={styles.detailHead}>
        <Mascot kind={surprise.mascot} mood={pick ? 'gift' : 'idle'} size={110} label={friend.label} />
        <div>
          <p className={styles.eyebrow}>Hộp quà bí mật</p>
          <h1>Cho {surprise.recipientName}</h1>
          <p className={styles.meta}>
            {friend.label} canh hộp quà
            {' · '}
            {opensLater ? `mở lúc ${dayjs(vnWallClock(surprise.opensAt)).format('HH:mm DD/MM/YYYY')}` : 'mở được ngay'}
          </p>
        </div>
      </header>

      {params.get('created') && !pick && (
        <p className={styles.created} role="status">Xong rồi! Gửi link dưới đây cho {surprise.recipientName}, nhớ đừng nói mật khẩu nha 🤫</p>
      )}

      <section className={styles.status} aria-labelledby="pick-title">
        <h2 id="pick-title" className="sr-only">Món quà đã chọn</h2>
        {pick ? (
          <div className={styles.picked}>
            <span className={styles.pickEmoji} aria-hidden>{pick.emoji || '🎁'}</span>
            <div>
              <p className={styles.eyebrow}>{surprise.recipientName} đã chọn</p>
              <strong>{pick.title}</strong>
              {pick.note && <p className={styles.pickNote}>“{pick.note}”</p>}
              <p className={styles.meta}>Lúc {dayjs(vnWallClock(pick.at)).format('HH:mm DD/MM/YYYY')}</p>
            </div>
            <Button size="small" startIcon={<IoRefreshOutline />} onClick={reopen}>Cho chọn lại</Button>
          </div>
        ) : (
          <p className={styles.waiting}>Chưa chọn quà. Khi {surprise.recipientName} chọn, bạn nhận email và trang này tự cập nhật.</p>
        )}
      </section>

      <section className={styles.share} aria-labelledby="share-title">
        <div className={styles.qr}><QRCode value={url} size={128} /></div>
        <div className={styles.shareText}>
          <h2 id="share-title">Link mở quà</h2>
          <code>{url}</code>
          <div className={styles.shareActions}>
            <Button variant="outlined" size="small" startIcon={<IoCopyOutline />} onClick={copy}>Copy link</Button>
            <Button variant="contained" size="small" startIcon={<IoShareSocialOutline />} onClick={share}>Gửi</Button>
            <Button size="small" startIcon={<IoOpenOutline />} href={url} target="_blank" rel="noreferrer">Mở thử</Button>
          </div>
          {surprise.hint && <p className={styles.meta}>Gợi ý mật khẩu: {surprise.hint}</p>}
        </div>
      </section>

      <section className={styles.summary} aria-labelledby="gifts-title">
        <h2 id="gifts-title">Quà để chọn</h2>
        <ul>
          {surprise.gifts.map(g => (
            <li key={g._id} className={pick && String(pick.gift) === String(g._id) ? styles.isPicked : undefined}>
              <span aria-hidden>{g.emoji || '🎁'}</span>
              <div>
                <strong>{g.title}</strong>
                {g.note && <span>{g.note}</span>}
              </div>
            </li>
          ))}
        </ul>
        {surprise.message && (
          <>
            <h2>Lá thư</h2>
            <p className={styles.letter}>{surprise.message}</p>
            {surprise.fromName && <p className={styles.meta}>— {surprise.fromName}</p>}
          </>
        )}
      </section>

      <div className={styles.actions}>
        <Button color="error" startIcon={<IoTrashOutline />} onClick={remove}>Xoá</Button>
        <Button variant="contained" startIcon={<IoCreateOutline />} component={Link} to={`/qua-bi-mat/${surprise._id}/sua`}>Sửa</Button>
      </div>
    </div>
  );
}
