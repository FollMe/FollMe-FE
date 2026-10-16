import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import QRCode from 'react-qr-code';
import { IoDownloadOutline, IoShareSocialOutline } from 'react-icons/io5';
import { eventHeadline, isCoupleEvent, sharedInvitationUrl } from 'util/invitation';
import { STORY_FORMATS, drawStory, storyFilename } from 'util/storyImage';
import { cldUrl } from 'util/photos';
import { track } from 'util/analytics';
import styles from './SaveTheDate.module.scss';

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    // No photo is better than no picture
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** The QR code drawn by react-qr-code, as an image for the canvas. */
function svgImage(svg) {
  if (!svg) {
    return Promise.resolve(null);
  }
  const markup = new XMLSerializer().serializeToString(svg);
  return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);
}

/**
 * A "Save the date" picture of the event to post on Zalo, Facebook or
 * Instagram: a story or a square, in the invitation's colors, with a QR
 * code to the shared link when it is on.
 */
export default function SaveTheDate({ event, onClose }) {
  const [format, setFormat] = useState('story');
  const [picture, setPicture] = useState(null);
  const qrRef = useRef(null);
  const couple = isCoupleEvent(event.type) && event.groomName && event.brideName;
  const cover = event.photos?.[0];

  useEffect(() => {
    let isActive = true;
    setPicture(null);
    (async () => {
      // The canvas draws with the site's fonts once they are in
      await document.fonts?.ready;
      const [photo, qr] = await Promise.all([
        cover ? loadImage(cldUrl(cover.url, 'w_800,h_1000,c_fill,g_faces')) : null,
        svgImage(qrRef.current?.querySelector('svg')),
      ]);
      const { width, height } = STORY_FORMATS[format];
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      drawStory(canvas.getContext('2d'), {
        format,
        theme: event.theme,
        couple: couple ? [event.groomName, event.brideName] : null,
        title: event.title,
        startAt: event.startAt,
        location: event.location,
        photo: format === 'story' ? photo : null,
        qr,
        glyph: couple ? '囍' : '✦',
      });
      canvas.toBlob(blob => {
        if (isActive && blob) {
          setPicture({ blob, url: URL.createObjectURL(blob) });
        }
      }, 'image/png');
    })();
    return () => {
      isActive = false;
    };
  }, [format, event, couple, cover]);

  // Frees the previous picture's object URL
  useEffect(() => () => picture && URL.revokeObjectURL(picture.url), [picture]);

  const filename = storyFilename(eventHeadline(event), format);
  const file = picture && new File([picture.blob], filename, { type: 'image/png' });
  const canShare = Boolean(file && navigator.canShare?.({ files: [file] }));

  async function share() {
    try {
      await navigator.share({ files: [file], title: eventHeadline(event) });
      track('save_the_date_shared', { format });
    } catch (err) {
      // Closed the share sheet
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="save-the-date-title">
      <DialogTitle id="save-the-date-title">Ảnh Save the date</DialogTitle>
      <DialogContent>
        <p className={styles.hint}>
          Đăng lên story Zalo, Facebook, Instagram hoặc gửi vào nhóm.
          {event.allowPublicLink ? ' Mã QR trên ảnh mở link chung của thiệp.' : ' Bật link chung để ảnh có mã QR mở thiệp.'}
        </p>
        <div className={styles.formats} role="radiogroup" aria-label="Khổ ảnh">
          {Object.entries(STORY_FORMATS).map(([key, f]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={format === key}
              className={clsx(format === key && styles.on)}
              onClick={() => setFormat(key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={clsx(styles.preview, styles[format])}>
          {picture ? (
            <img src={picture.url} alt={`Ảnh save the date của ${eventHeadline(event)}`} />
          ) : (
            <span className={styles.drawing}>Đang vẽ ảnh…</span>
          )}
        </div>
        {/* Drawn for the canvas only */}
        <div ref={qrRef} hidden>
          {event.allowPublicLink && <QRCode value={sharedInvitationUrl(event)} size={256} level="M" />}
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose}>Đóng</Button>
        {canShare && (
          <Button variant="outlined" startIcon={<IoShareSocialOutline />} onClick={share}>Chia sẻ</Button>
        )}
        <Button
          variant="contained"
          startIcon={<IoDownloadOutline />}
          disabled={!picture}
          component="a"
          href={picture?.url}
          download={filename}
          onClick={() => track('save_the_date_downloaded', { format })}
        >
          Tải ảnh
        </Button>
      </DialogActions>
    </Dialog>
  );
}
