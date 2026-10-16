import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { IoCameraOutline, IoTrashOutline } from 'react-icons/io5';
import { Lightbox } from './PhotoAlbum';
import { invitationApi } from 'util/invitation';
import { cldUrl, shrinkPhoto } from 'util/photos';
import { track } from 'util/analytics';
import styles from './GuestPhotos.module.scss';

// From a little before the party to a month after (the server checks too)
const OPENS_BEFORE_MS = 2 * 60 * 60 * 1000;
const CLOSES_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_GUEST_PHOTOS_EACH = 10;

/** Whether guests can send photos now. */
export function guestPhotosOpen(startAt, now = Date.now()) {
  const start = new Date(startAt).getTime();
  return now >= start - OPENS_BEFORE_MS && now <= start + CLOSES_AFTER_MS;
}

/**
 * "Ảnh từ khách": photos guests took at the party, on everyone's card.
 * A guest with their own link (or who answered on the shared one) sends
 * theirs, shrunk on the phone first, and can remove them.
 */
export default function GuestPhotos({ event, guest, headingClassName }) {
  const [photos, setPhotos] = useState(event.guestPhotos ?? []);
  const [progress, setProgress] = useState(null);
  const [openAt, setOpenAt] = useState(null);
  const inputRef = useRef(null);
  const open = guestPhotosOpen(event.startAt);
  const canSend = open && Boolean(guest?._id);
  const mine = photos.filter(p => p.mine).length;
  const left = MAX_GUEST_PHOTOS_EACH - mine;

  if (!photos.length && !open) {
    return null;
  }

  async function send(files) {
    const list = [...files].slice(0, Math.max(left, 0));
    if (files.length > list.length) {
      toast.info(`Mỗi người gửi tối đa ${MAX_GUEST_PHOTOS_EACH} ảnh, gửi ${list.length} ảnh đầu nhé.`);
    }
    let sent = 0;
    for (let i = 0; i < list.length; i++) {
      setProgress({ done: i, total: list.length });
      try {
        const { blob } = await shrinkPhoto(list[i]);
        const photo = await invitationApi.addGuestPhoto(guest._id, blob);
        setPhotos(current => [photo, ...current]);
        sent += 1;
      } catch (err) {
        if (err?.name !== 'SERVER_ERROR') {
          toast.error('Không đọc được một ảnh, thử chọn ảnh JPG hoặc PNG nhé.');
        }
        if (err?.status === 400) {
          // Over the limit or out of time: the rest would fail the same way
          break;
        }
      }
    }
    setProgress(null);
    if (sent) {
      track('guest_photos_sent', { count: sent });
      toast.success(sent > 1 ? `Đã gửi ${sent} ảnh. Cảm ơn bạn!` : 'Đã gửi ảnh. Cảm ơn bạn!');
    }
  }

  async function remove(photo) {
    if (!window.confirm('Xoá ảnh này khỏi album?')) {
      return;
    }
    try {
      await invitationApi.removeGuestPhoto(guest._id, photo._id);
      setPhotos(current => current.filter(p => p._id !== photo._id));
      setOpenAt(null);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className={styles.box}>
      <h2 className={headingClassName}>Ảnh từ khách</h2>
      <p className={styles.sub}>
        {photos.length
          ? `${photos.length} khoảnh khắc mọi người đã chụp`
          : 'Bạn chụp được tấm nào đẹp? Gửi lên để cô dâu chú rể và mọi người cùng xem.'}
      </p>
      {canSend && (
        <div className={styles.send}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => {
              send(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className={styles.sendButton}
            onClick={() => inputRef.current?.click()}
            disabled={Boolean(progress) || left <= 0}
          >
            <IoCameraOutline aria-hidden />
            {progress
              ? `Đang gửi ${progress.done + 1}/${progress.total}…`
              : left <= 0 ? `Bạn đã gửi đủ ${MAX_GUEST_PHOTOS_EACH} ảnh` : 'Gửi ảnh bạn chụp'}
          </button>
        </div>
      )}
      {open && !guest?._id && (
        <p className={styles.hint}>Xác nhận tham dự ở trên (nhập tên) là gửi được ảnh nhé.</p>
      )}
      {photos.length > 0 && (
        <ul className={styles.grid}>
          {photos.map((photo, i) => (
            <li key={photo._id}>
              <button type="button" className={styles.thumb} onClick={() => setOpenAt(i)} aria-label={`Xem ảnh của ${photo.name || 'khách'}`}>
                <img src={cldUrl(photo.url, 'w_400,h_400,c_fill,g_auto')} alt="" loading="lazy" decoding="async" />
              </button>
              <span className={styles.by}>{photo.name}</span>
              {photo.mine && (
                <button type="button" className={styles.remove} onClick={() => remove(photo)} aria-label="Xoá ảnh của bạn">
                  <IoTrashOutline />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {openAt !== null && photos[openAt] && (
        <Lightbox photos={photos} index={openAt} onIndex={setOpenAt} onClose={() => setOpenAt(null)} />
      )}
    </div>
  );
}
