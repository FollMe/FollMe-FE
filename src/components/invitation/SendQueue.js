import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import { IoPaperPlaneOutline, IoCopyOutline, IoCreateOutline, IoSparkles } from 'react-icons/io5';
import { invitationApi, personalInvitationUrl } from 'util/invitation';
import { LINK_TOKEN, NAME_TOKEN, canShareText, inviteMessage, sendInvite } from 'util/inviteMessage';
import { track } from 'util/analytics';
import styles from './SendQueue.module.scss';

/** Edits the message sent with each personal link. */
export function TemplateEditor({ value, onChange, onReset }) {
  return (
    <div className={styles.editor}>
      <TextField
        multiline
        minRows={3}
        fullWidth
        label="Lời mời"
        value={value}
        onChange={e => onChange(e.target.value)}
        helperText={`${NAME_TOKEN} là tên khách, ${LINK_TOKEN} là link thiệp riêng của họ.`}
      />
      <Button size="small" onClick={onReset}>Dùng lời mời mặc định</Button>
    </div>
  );
}

/**
 * Sends the personal links one after another: on a phone, one tap opens
 * the share sheet (Zalo, Messenger) with the message for that guest, and
 * the next guest comes up once it is sent.
 */
export default function SendQueue({ event, guests, template, onTemplateChange, onTemplateReset, onSent, onClose }) {
  // Who was still waiting when the queue opened, in list order
  const [queue] = useState(() => guests.filter(g => g.source !== 'public' && !g.sentAt).map(g => g._id));
  const [index, setIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fullScreen = useMediaQuery('(max-width: 600px)');
  const guest = guests.find(g => g._id === queue[index]);
  const done = index >= queue.length;
  const share = canShareText();
  const text = guest ? inviteMessage(template, guest.name, personalInvitationUrl(guest._id)) : '';

  // A guest removed meanwhile is skipped
  if (!done && !guest) {
    setIndex(i => i + 1);
  }

  async function send() {
    setIsSending(true);
    try {
      const how = await sendInvite(text);
      if (how === 'copied') {
        toast.success(`Đã copy lời mời cho ${guest.name}. Dán vào Zalo hoặc Messenger.`, { autoClose: 2000 });
      }
      onSent(await invitationApi.updateGuest(event._id, guest._id, { sent: true }));
      track('invite_sent', { how, queue: true });
      setSentCount(n => n + 1);
      setIndex(i => i + 1);
    } catch (err) {
      // Closed the share sheet: stay on this guest
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle className={styles.title}>
        Gửi thiệp lần lượt
        {!done && <span>{index + 1}/{queue.length}</span>}
      </DialogTitle>
      <LinearProgress variant="determinate" value={queue.length ? (Math.min(index, queue.length) / queue.length) * 100 : 100} />
      <DialogContent className={styles.content}>
        {done ? (
          <div className={styles.done}>
            <IoSparkles />
            <h3>{queue.length === 0 ? 'Tất cả khách đã được gửi thiệp' : `Xong! Đã gửi ${sentCount} thiệp`}</h3>
            <p>Theo dõi ai đã mở thiệp và trả lời ngay trong danh sách khách.</p>
          </div>
        ) : guest && (
          <>
            <p className={styles.next}>Gửi cho</p>
            <h3 className={styles.name}>{guest.name}</h3>
            {isEditing ? (
              <TemplateEditor value={template} onChange={onTemplateChange} onReset={onTemplateReset} />
            ) : (
              <div className={styles.preview}>
                {text}
                <button type="button" className={styles.edit} onClick={() => setIsEditing(true)}>
                  <IoCreateOutline /> Sửa lời mời
                </button>
              </div>
            )}
            <p className={styles.hint}>
              {share
                ? 'Bấm Gửi, chọn Zalo hoặc Messenger rồi chọn người nhận. Gửi xong, khách tiếp theo sẽ hiện ra.'
                : 'Bấm Copy, dán vào Zalo hoặc Messenger của khách. Khách tiếp theo sẽ hiện ra.'}
            </p>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {done ? (
          <Button variant="contained" onClick={onClose}>Đóng</Button>
        ) : (
          <>
            <Button onClick={onClose}>Để sau</Button>
            <Button onClick={() => setIndex(i => i + 1)} disabled={isSending}>Bỏ qua</Button>
            <LoadingButton
              variant="contained"
              loading={isSending}
              startIcon={share ? <IoPaperPlaneOutline /> : <IoCopyOutline />}
              onClick={send}
            >
              {share ? 'Gửi' : 'Copy lời mời'}
            </LoadingButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
