import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { IoCheckmarkCircle, IoAlertCircle, IoInformationCircle } from 'react-icons/io5';
import { guestIdFromQr, startScanner } from 'util/qrScan';
import { partySize } from 'util/desk';
import { tableLabel } from 'util/seating';
import { vnWallClock } from 'util/date';
import styles from './QrCheckIn.module.scss';

const RESULT_MS = 3500;

/**
 * "Quét mã": the desk points the phone at the QR on a guest's paper
 * invitation or on their phone (their personal link) and they are checked
 * in, with their table. Keeps scanning for the next guest.
 */
export default function QrCheckIn({ guests, onArrive, onClose }) {
  // The dialog mounts its content a render later (portal): start once the video is there
  const [video, setVideo] = useState(null);
  const latest = useRef({ guests, onArrive });
  latest.current = { guests, onArrive };
  const [status, setStatus] = useState('starting');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!video) {
      return undefined;
    }
    let stop = null;
    let cancelled = false;
    startScanner(video, text => {
      const id = guestIdFromQr(text);
      const guest = id && latest.current.guests.find(g => g._id === id);
      if (!guest) {
        setResult({ kind: 'unknown', at: Date.now() });
        return;
      }
      if (guest.arrivedAt) {
        setResult({ kind: 'again', guest, at: Date.now() });
        return;
      }
      latest.current.onArrive(guest);
      navigator.vibrate?.(60);
      setResult({ kind: 'ok', guest, at: Date.now() });
    })
      .then(s => {
        if (cancelled) {
          s();
        } else {
          stop = s;
          setStatus('scanning');
        }
      })
      .catch(err => {
        console.log(err);
        if (!cancelled) {
          setStatus('denied');
        }
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [video]);

  useEffect(() => {
    if (!result) {
      return undefined;
    }
    const id = setTimeout(() => setResult(r => (r?.at === result.at ? null : r)), RESULT_MS);
    return () => clearTimeout(id);
  }, [result]);

  return (
    <Dialog open fullScreen onClose={onClose} PaperProps={{ className: styles.paper }} aria-labelledby="qr-title">
      <div className={styles.top}>
        <h2 id="qr-title">Quét mã thiệp</h2>
        <Button variant="contained" onClick={onClose}>Xong</Button>
      </div>
      <div className={styles.stage}>
        <video ref={setVideo} className={styles.video} muted playsInline aria-hidden />
        {status !== 'denied' && <div className={styles.frame} aria-hidden />}
        {status === 'starting' && <p className={styles.hint}>Đang mở camera…</p>}
        {status === 'denied' && (
          <p className={styles.hint}>Không mở được camera. Cho phép trình duyệt dùng camera rồi thử lại, hoặc tìm tên khách trong danh sách.</p>
        )}
      </div>
      <div className={styles.bottom} role="status" aria-live="polite">
        {!result && status === 'scanning' && <p className={styles.hint}>Đưa mã QR trên thiệp giấy hoặc điện thoại của khách vào khung</p>}
        {result?.kind === 'ok' && (
          <div className={`${styles.result} ${styles.ok}`}>
            <IoCheckmarkCircle aria-hidden />
            <div>
              <strong>Đã đón {result.guest.name}</strong>
              <span>
                {partySize(result.guest)} người
                {result.guest.table ? ` · Mời vào ${tableLabel(result.guest.table)}` : ''}
              </span>
            </div>
          </div>
        )}
        {result?.kind === 'again' && (
          <div className={`${styles.result} ${styles.again}`}>
            <IoInformationCircle aria-hidden />
            <div>
              <strong>{result.guest.name} đã được đón</strong>
              <span>
                Lúc {dayjs(vnWallClock(result.guest.arrivedAt)).format('HH:mm')}
                {result.guest.table ? ` · ${tableLabel(result.guest.table)}` : ''}
              </span>
            </div>
          </div>
        )}
        {result?.kind === 'unknown' && (
          <div className={`${styles.result} ${styles.unknown}`}>
            <IoAlertCircle aria-hidden />
            <div>
              <strong>Không phải thiệp của tiệc này</strong>
              <span>Thử tìm tên khách trong danh sách</span>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
