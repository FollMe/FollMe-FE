import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { TextField } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { DateField, DateTimeField, LocalizationProvider } from '@mui/x-date-pickers';
import Button from '@mui/material/Button';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import Dialog from '@mui/material/Dialog';
import { IoSparklesOutline, IoEyeOutline, IoClose } from 'react-icons/io5';
import dayjs from 'dayjs';

import ArticleHeader from 'components/article/ArticleHeader';
import InvitationView from 'components/invitation/InvitationView';
import GiftAccountsField, { isGiftComplete, normalizeGifts } from 'components/invitation/GiftAccountsField';
import GuestListInput, { guestListError } from 'components/invitation/GuestListInput';
import PhotoManager from 'components/invitation/PhotoManager';
import OvalLoading from 'components/loading/OvalLoading';
import {
  DEFAULT_MESSAGES, EVENT_TYPES, THEMES, invitationApi, isCoupleEvent, suggestTitle,
} from 'util/invitation';
import { track } from 'util/analytics';
import { parseGuestList } from 'util/guestList';
import { fromVnWallClock, isAwayFromVietnam, vnWallClock } from 'util/date';
import styles from "./CreateEvent.module.scss";
import previewStyles from "components/invitation/ThemePreview.module.scss";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Only this form picks dates: the date picker stays out of the main bundle
export default function CreateEvent() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <CreateEventForm />
    </LocalizationProvider>
  );
}

function CreateEventForm() {
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
      // Weddings get the music box and the scratch-off date by default
      music: isCoupleEvent(initialType) ? 'canon' : 'none',
      scratchDate: isCoupleEvent(initialType),
      // Answer by (a day in Vietnam), or null
      rsvpBy: null,
      gifts: [],
    };
  });
  // Managed on the event page; shown here in the preview only
  // On a new invitation: photos picked but kept on the device until it is created
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);
  // Phones: the preview opens full screen instead of sitting below the form
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [effectsTouched, setEffectsTouched] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  // One guest per line; on edit, only the guests to add
  const [guestText, setGuestText] = useState('');
  const [invitedNames, setInvitedNames] = useState([]);
  const [errors, setErrors] = useState({});
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const couple = isCoupleEvent(form.type);
  const guestList = useMemo(() => parseGuestList(guestText, invitedNames), [guestText, invitedNames]);

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
          // The form holds the time as read in Vietnam, where the event is
          startAt: dayjs(vnWallClock(invitation.startAt)),
          location: invitation.location,
          mapLocation: invitation.mapLocation ?? '',
          message: invitation.message ?? '',
          theme: invitation.theme ?? 'minimal',
          allowPublicLink: Boolean(invitation.allowPublicLink),
          music: invitation.music ?? (isCoupleEvent(invitation.type) ? 'canon' : 'none'),
          scratchDate: invitation.scratchDate ?? isCoupleEvent(invitation.type),
          rsvpBy: invitation.rsvpBy ? dayjs(vnWallClock(invitation.rsvpBy)) : null,
          gifts: invitation.gifts ?? [],
        });
        setPhotos(invitation.photos ?? []);
        setInvitedNames((invitation.guests ?? []).map(g => g.name));
        setEffectsTouched(true);
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
    const effects = effectsTouched ? {} : { music: isCoupleEvent(type) ? 'canon' : 'none', scratchDate: isCoupleEvent(type) };
    set({ type, message, ...effects });
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
    if (form.rsvpBy && !form.rsvpBy.isValid()) {
      next.rsvpBy = 'Ngày không hợp lệ';
    } else if (form.rsvpBy && form.startAt?.isValid() && form.rsvpBy.isAfter(form.startAt, 'day')) {
      next.rsvpBy = 'Hạn xác nhận phải trước ngày tiệc';
    }
    if (!form.gifts.every(isGiftComplete)) {
      next.gifts = true;
    }
    if (guestListError(guestList)) {
      next.guests = true;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      // The field to fix is often far above the button: bring it into view
      requestAnimationFrame(() => {
        const field = e.target.querySelector('[aria-invalid="true"]');
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field?.focus({ preventScroll: true });
      });
      return;
    }
    setIsPosting(true);
    const payload = {
      type: form.type,
      theme: form.theme,
      title: form.title.trim(),
      groomName: couple ? form.groomName.trim() : '',
      brideName: couple ? form.brideName.trim() : '',
      startAt: fromVnWallClock(form.startAt.toDate()).toISOString(),
      location: form.location.trim(),
      mapLocation: form.mapLocation.trim(),
      message: form.message.trim(),
      allowPublicLink: form.allowPublicLink,
      music: form.music,
      scratchDate: form.scratchDate,
      // The end of that day in Vietnam
      rsvpBy: form.rsvpBy ? fromVnWallClock(form.rsvpBy.endOf('day').toDate()).toISOString() : null,
      gifts: normalizeGifts(form.gifts, couple).map(g => ({ ...g, accountName: g.accountName.trim() })),
    };
    try {
      if (isEditing) {
        await invitationApi.update(eventId, { ...payload, addGuests: guestList.guests });
        toast.success('Đã lưu thay đổi');
        navigate(`/events/${eventId}`);
      } else {
        const event = await invitationApi.create({ ...payload, guests: guestList.guests });
        track('invitation_created', { type: form.type, theme: form.theme, guests: guestList.guests.length, photos: photos.length });
        await uploadPhotos(event._id);
        navigate(`/events/${event._id}?created=1`);
      }
    } catch (err) {
      console.log(err);
      setIsPosting(false);
    }
  }

  /** Uploads the photos picked on the form, in order (the first is the cover). */
  async function uploadPhotos(id) {
    let failed = 0;
    for (const [i, photo] of photos.entries()) {
      setUploading({ done: i, total: photos.length });
      try {
        await invitationApi.addPhoto(id, photo.blob);
      } catch (err) {
        failed += 1;
      }
    }
    if (failed) {
      toast.error(`Chưa tải được ${failed} ảnh. Bạn thêm lại ở mục Ảnh cưới bên dưới nhé.`);
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
    startAt: fromVnWallClock((form.startAt?.isValid() ? form.startAt : dayjs()).toDate()).toISOString(),
    location: form.location || 'Địa điểm tổ chức',
    message: form.message,
    gifts: normalizeGifts(form.gifts, couple).filter(isGiftComplete),
    photos,
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
              slotProps={{
                textField: {
                  error: Boolean(errors.startAt),
                  // Hosts abroad: the time is read as Vietnam time, like guests see it
                  helperText: errors.startAt ?? (isAwayFromVietnam() ? 'Theo giờ Việt Nam (GMT+7)' : undefined),
                },
              }}
            />
            <TextField fullWidth label="Địa điểm" value={form.location} inputProps={{ maxLength: 300 }} onChange={e => set({ location: e.target.value })} error={Boolean(errors.location)} helperText={errors.location ?? 'Ví dụ: Trung tâm tiệc cưới ABC, 123 Lê Lợi, Quận 1'} />
            <TextField fullWidth label="Link Google Maps (không bắt buộc)" value={form.mapLocation} inputProps={{ maxLength: 1000 }} onChange={e => set({ mapLocation: e.target.value })} helperText="Để trống thì khách sẽ được chỉ đường theo địa chỉ ở trên." />
            <TextField fullWidth multiline minRows={3} label="Lời mời" value={form.message} inputProps={{ maxLength: 1000 }} onChange={e => set({ message: e.target.value })} />
          </fieldset>

          <fieldset className={styles.group}>
            <legend>{couple ? 'Ảnh cưới' : 'Hình ảnh'} (không bắt buộc)</legend>
            <p className={styles.hint}>
              Ảnh đầu tiên là ảnh bìa, cũng là ảnh hiện ra khi gửi link qua Zalo, Messenger. Từ 2 ảnh trở lên, thiệp có thêm
              album.{isEditing ? ' Ảnh được lưu ngay khi bạn thêm, xoá hay đổi thứ tự.' : ''}
            </p>
            <PhotoManager
              eventId={isEditing ? eventId : undefined}
              photos={photos}
              onChange={setPhotos}
              onBusyChange={setIsAddingPhotos}
            />
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
            <legend>Hiệu ứng</legend>
            <FormControlLabel
              control={(
                <Switch
                  checked={form.music !== 'none'}
                  onChange={e => {
                    setEffectsTouched(true);
                    set({ music: e.target.checked ? 'canon' : 'none' });
                  }}
                />
              )}
              label="Nhạc nền hộp nhạc (Canon in D) khi khách mở thiệp"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={form.scratchDate}
                  onChange={e => {
                    setEffectsTouched(true);
                    set({ scratchDate: e.target.checked });
                  }}
                />
              )}
              label={`Khách cào lớp nhũ để xem ${couple ? 'ngày cưới' : 'ngày'}`}
            />
          </fieldset>

          <fieldset className={styles.group}>
            <legend>{couple ? 'Hộp mừng cưới' : 'Quà mừng'} (không bắt buộc)</legend>
            <GiftAccountsField
              value={form.gifts}
              couple={couple}
              showErrors={Boolean(errors.gifts)}
              onChange={gifts => set({ gifts })}
            />
          </fieldset>

          <fieldset className={styles.group}>
            <legend>Gửi cho khách</legend>
            <FormControlLabel
              control={<Switch checked={form.allowPublicLink} onChange={e => set({ allowPublicLink: e.target.checked })} />}
              label="Tạo link chung để gửi vào nhóm (ai có link cũng xem và xác nhận được)"
            />
            <GuestListInput
              value={guestText}
              onChange={setGuestText}
              existing={invitedNames}
              label={isEditing ? 'Mời thêm khách' : 'Khách mời riêng (không bắt buộc)'}
            />
            <div className={styles.deadline}>
              <DateField
                fullWidth
                label="Hạn xác nhận tham dự (không bắt buộc)"
                format="DD/MM/YYYY"
                value={form.rsvpBy}
                onChange={value => set({ rsvpBy: value })}
                slotProps={{
                  textField: {
                    error: Boolean(errors.rsvpBy),
                    helperText: errors.rsvpBy ?? 'Thiệp và lời nhắc sẽ ghi "Vui lòng trả lời trước …". Hết hạn khách vẫn trả lời được.',
                  },
                }}
              />
              <div className={styles.deadlineActions}>
                {form.startAt?.isValid() && (
                  <Button size="small" onClick={() => set({ rsvpBy: form.startAt.subtract(7, 'day').startOf('day') })}>
                    1 tuần trước tiệc
                  </Button>
                )}
                {form.rsvpBy && <Button size="small" onClick={() => set({ rsvpBy: null })}>Bỏ hạn</Button>}
              </div>
            </div>
          </fieldset>

          <div className={styles.submit}>
            <LoadingButton
              type="submit"
              variant="contained"
              size="large"
              loading={isPosting}
              disabled={isAddingPhotos}
              loadingPosition="start"
              startIcon={<IoSparklesOutline />}
            >
              {uploading && `Đang tải ảnh ${uploading.done + 1}/${uploading.total}…`}
              {!uploading && isAddingPhotos && 'Đang xử lý ảnh…'}
              {!uploading && !isAddingPhotos && (isEditing ? 'Lưu thay đổi' : 'Tạo thiệp')}
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

        <button type="button" className={styles.previewFab} onClick={() => setIsPreviewOpen(true)}>
          <IoEyeOutline aria-hidden /> Xem trước
        </button>
        {isPreviewOpen && (
          <Dialog open fullScreen onClose={() => setIsPreviewOpen(false)} aria-label="Xem trước thiệp">
            <div className={styles.previewDialog}>
              <InvitationView event={previewEvent} demo embedded />
            </div>
            <button type="button" className={styles.previewClose} onClick={() => setIsPreviewOpen(false)}>
              <IoClose aria-hidden /> Quay lại sửa
            </button>
          </Dialog>
        )}
      </form>
    </div>
  );
}
