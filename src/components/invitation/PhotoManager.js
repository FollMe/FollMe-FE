import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-toastify';
import { IoAdd, IoChevronBack, IoChevronForward, IoStarOutline, IoTrashOutline } from 'react-icons/io5';
import { MAX_PHOTOS, invitationApi } from 'util/invitation';
import { cldUrl, shrinkPhoto } from 'util/photos';
import { track } from 'util/analytics';
import styles from './PhotoManager.module.scss';

/** Moves the item at `from` to `to`. */
export function moveItem(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * The host's album editor. With `eventId`, changes are saved as they are
 * made. Without it (an invitation not created yet), photos stay on the
 * device, shrunk and in order, each with its `blob` for the form to upload.
 * `onChange` gets an updater function, as photos arrive one by one;
 * `onBusyChange` hears when photos are being added.
 */
export default function PhotoManager({ eventId, photos, onChange, onBusyChange }) {
  const local = !eventId;
  const [pending, setPending] = useState([]);
  const busy = pending.length > 0;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  const [busyId, setBusyId] = useState(null);
  const inputRef = useRef(null);
  const free = MAX_PHOTOS - photos.length - pending.length;

  // Previews of photos being added, and of photos kept on the device
  const previews = useRef([]);
  useEffect(() => () => previews.current.forEach(URL.revokeObjectURL), []);

  async function upload(fileList) {
    const files = Array.from(fileList).slice(0, Math.max(0, free));
    if (fileList.length > files.length) {
      toast.info(`Mỗi thiệp có tối đa ${MAX_PHOTOS} ảnh, chỉ thêm ${files.length} ảnh đầu.`);
    }
    const items = files.map(file => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return { key: preview, file, preview };
    });
    setPending(list => [...list, ...items]);
    // One at a time, so the album keeps the order they were picked in
    for (const item of items) {
      try {
        const { blob } = await shrinkPhoto(item.file);
        if (local) {
          const url = URL.createObjectURL(blob);
          previews.current.push(url);
          onChange(list => [...list, { _id: item.key, url, blob }]);
        } else {
          const photo = await invitationApi.addPhoto(eventId, blob);
          onChange(list => [...list, photo]);
          track('photo_uploaded');
        }
      } catch (err) {
        if (err.name !== 'SERVER_ERROR') {
          toast.error(`Không đọc được ảnh "${item.file.name}". Hãy chọn ảnh JPG hoặc PNG.`);
        }
      } finally {
        setPending(list => list.filter(p => p.key !== item.key));
      }
    }
  }

  async function reorder(from, to) {
    const before = photos;
    const next = moveItem(photos, from, to);
    onChange(() => next);
    if (local) {
      return;
    }
    try {
      await invitationApi.orderPhotos(eventId, next.map(p => p._id));
    } catch (err) {
      onChange(() => before);
    }
  }

  async function remove(photo) {
    if (local) {
      onChange(list => list.filter(p => p._id !== photo._id));
      return;
    }
    if (!window.confirm('Xoá ảnh này khỏi thiệp?')) {
      return;
    }
    setBusyId(photo._id);
    try {
      await invitationApi.removePhoto(eventId, photo._id);
      onChange(list => list.filter(p => p._id !== photo._id));
    } catch (err) {
      console.log(err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={styles.manager}>
      <ul className={styles.grid}>
        {photos.map((photo, i) => (
          <li key={photo._id} className={clsx(styles.tile, busyId === photo._id && styles.busy)}>
            <img src={cldUrl(photo.url, 'w_360,h_360,c_fill,g_faces')} alt={`Ảnh ${i + 1}`} loading="lazy" />
            {i === 0 && <span className={styles.badge}>Ảnh bìa</span>}
            <div className={styles.actions}>
              {i > 0 && (
                <Tooltip title="Đặt làm ảnh bìa">
                  <button type="button" onClick={() => reorder(i, 0)} aria-label="Đặt làm ảnh bìa"><IoStarOutline /></button>
                </Tooltip>
              )}
              {i > 0 && (
                <Tooltip title="Lên trước">
                  <button type="button" onClick={() => reorder(i, i - 1)} aria-label="Lên trước"><IoChevronBack /></button>
                </Tooltip>
              )}
              {i < photos.length - 1 && (
                <Tooltip title="Ra sau">
                  <button type="button" onClick={() => reorder(i, i + 1)} aria-label="Ra sau"><IoChevronForward /></button>
                </Tooltip>
              )}
              <Tooltip title="Xoá">
                <button type="button" className={styles.danger} onClick={() => remove(photo)} aria-label="Xoá ảnh">
                  <IoTrashOutline />
                </button>
              </Tooltip>
            </div>
          </li>
        ))}
        {pending.map(item => (
          <li key={item.key} className={clsx(styles.tile, styles.busy)}>
            <img src={item.preview} alt="" />
            <CircularProgress size={28} className={styles.spinner} aria-label="Đang tải ảnh lên" />
          </li>
        ))}
        {free > 0 && (
          <li>
            <button type="button" className={styles.add} onClick={() => inputRef.current?.click()}>
              <IoAdd />
              <span>{photos.length + pending.length === 0 ? 'Thêm ảnh cưới' : 'Thêm ảnh'}</span>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        hidden
        onChange={e => {
          upload(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
