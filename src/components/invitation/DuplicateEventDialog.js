import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import LoadingButton from '@mui/lab/LoadingButton';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { eventHeadline, hasPersonalLink, invitationApi, isCoupleEvent } from 'util/invitation';
import { fromVnWallClock, vnWallClock } from 'util/date';
import { track } from 'util/analytics';
import styles from './DuplicateEventDialog.module.scss';

/** Names hosts give the other ceremonies of a wedding. */
export function titleSuggestions(event) {
  if (!isCoupleEvent(event.type) || !event.groomName || !event.brideName) {
    return [];
  }
  const couple = eventHeadline(event);
  const names = event.type === 'engagement'
    ? [`Lễ ăn hỏi ${couple}`, `Tiệc thân mật ${couple}`]
    : [`Lễ vu quy ${couple}`, `Lễ thành hôn ${couple}`, `Tiệc báo hỷ ${couple}`];
  return names.filter(name => name !== event.title);
}

/**
 * A copy of the event for another ceremony: the same look, photos, gift
 * accounts and program, its own title, time and place, and if wanted the
 * same guests with new personal links.
 */
export default function DuplicateEventDialog({ event, onClose }) {
  const navigate = useNavigate();
  const suggestions = titleSuggestions(event);
  const invited = (event.guests ?? []).filter(hasPersonalLink).length;
  const [title, setTitle] = useState(suggestions[0] ?? event.title);
  // The time as read in Vietnam, where the event is
  const [startAt, setStartAt] = useState(dayjs(vnWallClock(event.startAt)).format('YYYY-MM-DDTHH:mm'));
  const [location, setLocation] = useState(event.location);
  const [copyGuests, setCopyGuests] = useState(invited > 0);
  const [isSaving, setIsSaving] = useState(false);
  const valid = title.trim().length >= 3 && location.trim().length >= 3 && dayjs(startAt).isValid();

  async function save(e) {
    e.preventDefault();
    if (!valid) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await invitationApi.duplicate(event._id, {
        title: title.trim(),
        startAt: fromVnWallClock(new Date(startAt)).toISOString(),
        location: location.trim(),
        copyGuests,
      });
      track('event_duplicated', { guests: res.guests });
      toast.success(res.guests ? `Đã tạo thiệp mới với ${res.guests} khách` : 'Đã tạo thiệp mới');
      navigate(`/events/${res._id}?created=1`);
      onClose();
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="duplicate-title">
      <form onSubmit={save}>
        <DialogTitle id="duplicate-title">Thiệp cho lễ khác</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p className={styles.hint}>
            Thiệp mới giữ mẫu, ảnh, lời mời, chương trình và tài khoản mừng của thiệp này. Câu trả lời, lời chúc, sổ mừng
            và thu chi không được chép.
          </p>
          <div>
            <TextField
              fullWidth
              label="Tên sự kiện"
              value={title}
              inputProps={{ maxLength: 150 }}
              onChange={e => setTitle(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className={styles.quick} role="group" aria-label="Tên gợi ý">
                {suggestions.map(name => (
                  <button key={name} type="button" aria-pressed={title === name} onClick={() => setTitle(name)}>
                    {name.replace(` ${eventHeadline(event)}`, '')}
                  </button>
                ))}
              </div>
            )}
          </div>
          <TextField
            fullWidth
            type="datetime-local"
            label="Thời gian (giờ Việt Nam)"
            value={startAt}
            onChange={e => setStartAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Địa điểm"
            value={location}
            inputProps={{ maxLength: 300 }}
            onChange={e => setLocation(e.target.value)}
            helperText={location.trim() !== event.location ? 'Link Google Maps cũ sẽ được bỏ, khách được chỉ đường theo địa chỉ mới.' : ' '}
          />
          {invited > 0 && (
            <FormControlLabel
              control={<Switch checked={copyGuests} onChange={e => setCopyGuests(e.target.checked)} />}
              label={`Mời cùng ${invited} khách (link riêng mới, chưa gửi)`}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSaving} disabled={!valid}>Tạo thiệp</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
