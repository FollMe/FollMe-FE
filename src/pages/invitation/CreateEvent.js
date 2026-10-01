import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Autocomplete, Chip, TextField } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { DateTimeField } from '@mui/x-date-pickers';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import { IoSparklesOutline } from 'react-icons/io5';
import dayjs from 'dayjs';

import ArticleHeader from 'components/article/ArticleHeader';
import InvitationView from 'components/invitation/InvitationView';
import OvalLoading from 'components/loading/OvalLoading';
import {
  DEFAULT_MESSAGES, EVENT_TYPES, THEMES, invitationApi, isCoupleEvent, suggestTitle,
} from 'util/invitation';
import { track } from 'util/analytics';
import styles from "./CreateEvent.module.scss";
import previewStyles from "components/invitation/ThemePreview.module.scss";

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseGuest(text) {
  const [name, email] = text.split(' | ');
  return { name, email };
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEditing = Boolean(eventId);
  const [searchParams] = useSearchParams();
  const initialType = EVENT_TYPES.some(t => t.value === searchParams.get('type')) ? searchParams.get('type') : 'wedding';
  const initialDate = DATE_RE.test(searchParams.get('date') ?? '')
    ? dayjs(`${searchParams.get('date')}T11:00`)
    : dayjs().add(30, 'day').hour(11).minute(0).second(0);

  const [form, setForm] = useState(() => {
    const groomName = searchParams.get('groom') ?? '';
    const brideName = searchParams.get('bride') ?? '';
    return {
      type: initialType,
      groomName,
      brideName,
      title: suggestTitle(initialType, groomName, brideName),
      startAt: initialDate,
      location: '',
      mapLocation: '',
      message: DEFAULT_MESSAGES[initialType],
      theme: initialType === 'wedding' || initialType === 'engagement' ? 'blush' : 'minimal',
      allowPublicLink: true,
    };
  });
  const [titleTouched, setTitleTouched] = useState(false);
  const [guests, setGuests] = useState([]);
  const [guestInput, setGuestInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const couple = isCoupleEvent(form.type);

  useEffect(() => {
    document.title = `${isEditing ? 'Sửa thiệp' : 'Tạo thiệp mời'} | FollMe`;
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setForm({
          type: invitation.type ?? 'other',
          groomName: invitation.groomName ?? '',
          brideName: invitation.brideName ?? '',
          title: invitation.title,
          startAt: dayjs(invitation.startAt),
          location: invitation.location,
          mapLocation: invitation.mapLocation ?? '',
          message: invitation.message ?? '',
          theme: invitation.theme ?? 'minimal',
          allowPublicLink: Boolean(invitation.allowPublicLink),
        });
        setTitleTouched(true);
        setIsLoading(false);
      })
      .catch(() => navigate('/events'));
  }, [isEditing, eventId, navigate]);

  // Keep the title in sync with the couple's names until it is edited.
  const suggestedTitle = useMemo(() => suggestTitle(form.type, form.groomName.trim(), form.brideName.trim()), [form.type, form.groomName, form.brideName]);
  useEffect(() => {
    if (!titleTouched && suggestedTitle) {
      setForm(f => ({ ...f, title: suggestedTitle }));
    }
  }, [suggestedTitle, titleTouched]);

  function changeType(type) {
    const message = form.message === DEFAULT_MESSAGES[form.type] ? DEFAULT_MESSAGES[type] : form.message;
    set({ type, message });
  }

  function onChangeGuests(_, value, reason) {
    if (reason !== 'createOption') {
      setGuests(value);
      return;
    }
    const inputValue = value.pop();
    const detailValues = inputValue.split('|');
    const name = detailValues[0].trim().replace(/\s+/g, ' ');
    const email = detailValues?.[1]?.trim()?.toLowerCase();
    if (!name || detailValues.length > 2 || (detailValues.length === 2 && !emailRegex.test(email))) {
      setGuestInput(inputValue);
      return;
    }
    const newValue = `${name}${email ? ` | ${email}` : ''}`;
    if (!value.includes(newValue)) {
      setGuests([...value, newValue]);
    }
  }

  function validate() {
    const next = {};
    if (couple && (!form.groomName.trim() || !form.brideName.trim())) {
      next.couple = 'Vui lòng nhập tên chú rể và cô dâu';
    }
    if (form.title.trim().length < 3) {
      next.title = 'Tên sự kiện cần ít nhất 3 kí tự';
    }
    if (form.location.trim().length < 3) {
      next.location = 'Vui lòng nhập địa điểm';
    }
    if (!form.startAt?.isValid()) {
      next.startAt = 'Thời gian không hợp lệ';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    setIsPosting(true);
    const payload = {
      type: form.type,
      theme: form.theme,
      title: form.title.trim(),
      groomName: couple ? form.groomName.trim() : '',
      brideName: couple ? form.brideName.trim() : '',
      startAt: form.startAt.toISOString(),
      location: form.location.trim(),
      mapLocation: form.mapLocation.trim(),
      message: form.message.trim(),
      allowPublicLink: form.allowPublicLink,
    };
    try {
      if (isEditing) {
        await invitationApi.update(eventId, { ...payload, addGuests: guests.map(parseGuest) });
        toast.success('Đã lưu thay đổi');
        navigate(`/events/${eventId}`);
      } else {
        const event = await invitationApi.create({ ...payload, guests: guests.map(parseGuest) });
        track('invitation_created', { type: form.type, theme: form.theme, guests: guests.length });
        navigate(`/events/${event._id}?created=1`);
      }
    } catch (err) {
      console.log(err);
      setIsPosting(false);
    }
  }

  if (isLoading) {
    return <OvalLoading />;
  }

  const previewEvent = {
    _id: 'preview',
    type: form.type,
    theme: form.theme,
    title: form.title || 'Tên sự kiện',
    groomName: form.groomName.trim(),
    brideName: form.brideName.trim(),
    startAt: (form.startAt?.isValid() ? form.startAt : dayjs()).toISOString(),
    location: form.location || 'Địa điểm tổ chức',
    message: form.message,
  };

  return (
    <div className="container page">
      <ArticleHeader
        back={{ to: '/events', label: 'Thiệp của tôi' }}
        eyebrow="Thiệp mời online"
        title={isEditing ? 'Sửa thiệp mời' : 'Tạo thiệp mời'}
        subtitle="Chọn mẫu, điền thông tin, rồi gửi link cho khách qua Zalo, Messenger hay email. Khách xác nhận tham dự và gửi lời chúc ngay trên thiệp."
      />

      <form className={styles.layout} onSubmit={submit} noValidate>
        <div className={styles.panel}>
          <fieldset className={styles.group}>
            <legend>Loại sự kiện</legend>
            <div className={styles.types}>
              {EVENT_TYPES.map(t => (
                <button
                  type="button"
                  key={t.value}
                  className={clsx(styles.type, form.type === t.value && styles.selected)}
                  aria-pressed={form.type === t.value}
                  onClick={() => changeType(t.value)}
                >
                  <span aria-hidden>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          {couple && (
            <fieldset className={styles.group}>
              <legend>Cô dâu & chú rể</legend>
              <div className={styles.row}>
                <TextField label="Tên chú rể" value={form.groomName} inputProps={{ maxLength: 50 }} onChange={e => set({ groomName: e.target.value })} error={Boolean(errors.couple && !form.groomName.trim())} />
                <TextField label="Tên cô dâu" value={form.brideName} inputProps={{ maxLength: 50 }} onChange={e => set({ brideName: e.target.value })} error={Boolean(errors.couple && !form.brideName.trim())} />
              </div>
              {errors.couple && <p className={styles.error}>{errors.couple}</p>}
            </fieldset>
          )}

          <fieldset className={styles.group}>
            <legend>Thông tin</legend>
            <TextField
              fullWidth
              label="Tên sự kiện"
              value={form.title}
              inputProps={{ maxLength: 150 }}
              onChange={e => {
                setTitleTouched(true);
                set({ title: e.target.value });
              }}
              error={Boolean(errors.title)}
              helperText={errors.title}
            />
            <DateTimeField
              fullWidth
              label="Thời gian"
              format="HH:mm DD/MM/YYYY"
              ampm={false}
              value={form.startAt}
              onChange={value => set({ startAt: value })}
              slotProps={{ textField: { error: Boolean(errors.startAt), helperText: errors.startAt } }}
            />
            <TextField fullWidth label="Địa điểm" value={form.location} inputProps={{ maxLength: 300 }} onChange={e => set({ location: e.target.value })} error={Boolean(errors.location)} helperText={errors.location ?? 'Ví dụ: Trung tâm tiệc cưới ABC, 123 Lê Lợi, Quận 1'} />
            <TextField fullWidth label="Link Google Maps (không bắt buộc)" value={form.mapLocation} inputProps={{ maxLength: 1000 }} onChange={e => set({ mapLocation: e.target.value })} helperText="Để trống thì khách sẽ được chỉ đường theo địa chỉ ở trên." />
            <TextField fullWidth multiline minRows={3} label="Lời mời" value={form.message} inputProps={{ maxLength: 1000 }} onChange={e => set({ message: e.target.value })} />
          </fieldset>

          <fieldset className={styles.group}>
            <legend>Mẫu thiệp</legend>
            <div className={styles.themes} role="radiogroup" aria-label="Mẫu thiệp">
              {THEMES.map(t => (
                <button
                  type="button"
                  key={t.value}
                  role="radio"
                  aria-checked={form.theme === t.value}
                  className={clsx(styles.themeOption, form.theme === t.value && styles.selected)}
                  onClick={() => set({ theme: t.value })}
                >
                  <span className={clsx(styles.swatch, previewStyles[`theme_${t.value}`])} />
                  <strong>{t.label}</strong>
                  <small>{t.hint}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend>Gửi cho khách</legend>
            <FormControlLabel
              control={<Switch checked={form.allowPublicLink} onChange={e => set({ allowPublicLink: e.target.checked })} />}
              label="Tạo link chung để gửi vào nhóm (ai có link cũng xem và xác nhận được)"
            />
            <Autocomplete
              clearIcon={false}
              options={[]}
              value={guests}
              onChange={onChangeGuests}
              inputValue={guestInput}
              onInputChange={(_, value) => setGuestInput(value)}
              freeSolo
              multiple
              renderTags={(value, props) => value.map((option, index) => <Chip label={option} {...props({ index })} />)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`${isEditing ? 'Mời thêm khách' : 'Khách mời riêng'}${guests.length ? ` (${guests.length})` : ''}`}
                  helperText="Gõ tên rồi Enter, mỗi khách có một link riêng ghi tên họ. Thêm email theo cú pháp: Tên | email để gửi thư mời tự động."
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace') {
                      event.stopPropagation();
                    }
                  }}
                />
              )}
            />
          </fieldset>

          <div className={styles.submit}>
            <LoadingButton type="submit" variant="contained" size="large" loading={isPosting} startIcon={<IoSparklesOutline />}>
              {isEditing ? 'Lưu thay đổi' : 'Tạo thiệp'}
            </LoadingButton>
          </div>
        </div>

        <aside className={styles.previewWrap}>
          <div className={styles.previewLabel}>Xem trước · khách sẽ thấy thế này</div>
          <div className={styles.phone}>
            <div className={styles.phoneScreen}>
              <div className={styles.phoneContent}>
                <InvitationView event={previewEvent} demo embedded />
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
