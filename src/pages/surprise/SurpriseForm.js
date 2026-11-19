import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import dayjs from 'dayjs';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import { IoAdd, IoClose } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import OvalLoading from 'components/loading/OvalLoading';
import Mascot from 'components/surprise/Mascot';
import { fromVnWallClock, isAwayFromVietnam, vnWallClock } from 'util/date';
import { track } from 'util/analytics';
import {
  GIFT_IDEAS, MASCOTS, MAX_GIFTS, MAX_GIFT_NOTE, MAX_GIFT_TITLE, MAX_HINT, MAX_MESSAGE, MAX_NAME, MAX_PASSWORD, MIN_GIFTS, MIN_PASSWORD,
  newGiftRow, surpriseApi, tidyGiftRows, toGiftRows,
} from 'util/surprise';
import styles from './Surprise.module.scss';

const loose = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

const EMPTY = {
  recipientName: '',
  fromName: '',
  password: '',
  hint: '',
  opensAt: '',
  mascot: 'bear',
  message: '',
  gifts: [newGiftRow(GIFT_IDEAS[0]), newGiftRow(GIFT_IDEAS[1]), newGiftRow(GIFT_IDEAS[2])],
};

/** "Hộp quà bí mật": make or edit a birthday surprise (/qua-bi-mat/tao, /qua-bi-mat/:id/sua). */
export default function SurpriseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const set = patch => setForm(f => ({ ...f, ...patch }));

  useEffect(() => {
    document.title = `${isEditing ? 'Sửa hộp quà' : 'Tạo hộp quà bí mật'} | FollMe`;
    if (!isEditing) {
      return;
    }
    surpriseApi.get(id)
      .then(s => {
        setForm({
          recipientName: s.recipientName ?? '',
          fromName: s.fromName ?? '',
          password: '',
          hint: s.hint ?? '',
          // The form reads the time as in Vietnam
          opensAt: s.opensAt ? dayjs(vnWallClock(s.opensAt)).format('YYYY-MM-DDTHH:mm') : '',
          mascot: s.mascot ?? 'bear',
          message: s.message ?? '',
          gifts: toGiftRows(s.gifts),
        });
        setIsLoading(false);
      })
      .catch(() => navigate('/qua-bi-mat'));
  }, [id, isEditing, navigate]);

  function updateGift(rowId, patch) {
    set({ gifts: form.gifts.map(g => (g.id === rowId ? { ...g, ...patch } : g)) });
  }

  function validate() {
    const next = {};
    if (!form.recipientName.trim()) {
      next.recipientName = 'Nhập tên người nhận';
    }
    if ((!isEditing || form.password) && loose(form.password).length < MIN_PASSWORD) {
      next.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự`;
    }
    if (tidyGiftRows(form.gifts).length < MIN_GIFTS) {
      next.gifts = `Cần ít nhất ${MIN_GIFTS} món để chọn`;
    }
    if (form.opensAt && !dayjs(form.opensAt).isValid()) {
      next.opensAt = 'Thời gian không hợp lệ';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Kiểm tra lại giúp mình nha');
      return;
    }
    setIsSaving(true);
    const payload = {
      recipientName: form.recipientName.trim(),
      fromName: form.fromName.trim(),
      hint: form.hint.trim(),
      mascot: form.mascot,
      message: form.message.trim(),
      opensAt: form.opensAt ? fromVnWallClock(new Date(form.opensAt)).toISOString() : null,
      gifts: tidyGiftRows(form.gifts),
      ...(form.password ? { password: form.password } : {}),
    };
    try {
      if (isEditing) {
        await surpriseApi.update(id, payload);
        toast.success('Đã lưu hộp quà');
        navigate(`/qua-bi-mat/${id}`);
      } else {
        const res = await surpriseApi.create(payload);
        track('surprise_created', { gifts: payload.gifts.length, mascot: payload.mascot });
        navigate(`/qua-bi-mat/${res._id}?created=1`);
      }
    } catch (err) {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <OvalLoading />;
  }

  const usedTitles = new Set(form.gifts.map(g => g.title.trim()));
  const ideas = GIFT_IDEAS.filter(idea => !usedTitles.has(idea.title));
  return (
    <div className="container page">
      <PageHeader
        eyebrow="Hộp quà bí mật"
        title={isEditing ? 'Sửa hộp quà' : 'Tạo hộp quà sinh nhật'}
        description="Người ấy mở link, nhập mật khẩu chỉ hai người biết, thổi nến, đọc thư rồi chọn một món quà. Bạn biết ngay họ chọn gì."
      />
      <form className={styles.form} onSubmit={submit} noValidate>
        <fieldset className={styles.group}>
          <legend>Gửi ai</legend>
          <div className={styles.row}>
            <TextField
              label="Tên người nhận"
              placeholder="Vy"
              value={form.recipientName}
              onChange={e => set({ recipientName: e.target.value })}
              inputProps={{ maxLength: MAX_NAME }}
              error={Boolean(errors.recipientName)}
              helperText={errors.recipientName ?? 'Linh vật sẽ gọi tên này'}
              required
            />
            <TextField
              label="Ký tên"
              placeholder="Anh Tuấn"
              value={form.fromName}
              onChange={e => set({ fromName: e.target.value })}
              inputProps={{ maxLength: MAX_NAME }}
              helperText="Cuối lá thư"
            />
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Mật khẩu</legend>
          <div className={styles.row}>
            <TextField
              label={isEditing ? 'Mật khẩu mới' : 'Mật khẩu'}
              placeholder={isEditing ? 'Để trống nếu giữ như cũ' : '14022023'}
              value={form.password}
              onChange={e => set({ password: e.target.value })}
              inputProps={{ maxLength: MAX_PASSWORD, autoComplete: 'off' }}
              error={Boolean(errors.password)}
              helperText={errors.password ?? 'Không phân biệt hoa thường, dấu và khoảng trắng'}
              required={!isEditing}
            />
            <TextField
              label="Gợi ý mật khẩu (không bắt buộc)"
              placeholder="Ngày mình quen nhau (ddmmyyyy)"
              value={form.hint}
              onChange={e => set({ hint: e.target.value })}
              inputProps={{ maxLength: MAX_HINT }}
              helperText="Hiện dưới ô mật khẩu"
            />
          </div>
          <TextField
            type="datetime-local"
            label="Mở từ lúc (không bắt buộc)"
            value={form.opensAt}
            onChange={e => set({ opensAt: e.target.value })}
            InputLabelProps={{ shrink: true }}
            error={Boolean(errors.opensAt)}
            helperText={errors.opensAt ?? `Trước giờ này hộp quà khoá, linh vật ngủ và đếm ngược.${isAwayFromVietnam() ? ' Giờ Việt Nam.' : ''} Để trống là mở ngay.`}
          />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Linh vật</legend>
          <div className={styles.mascots} role="radiogroup" aria-label="Linh vật">
            {MASCOTS.map(m => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={form.mascot === m.key}
                className={clsx(styles.mascotChoice, form.mascot === m.key && styles.on)}
                onClick={() => set({ mascot: m.key })}
              >
                <Mascot kind={m.key} mood={form.mascot === m.key ? 'happy' : 'idle'} size={84} label="" />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Lá thư</legend>
          <TextField
            multiline
            minRows={4}
            label="Lời nhắn"
            placeholder="Chúc em tuổi mới thật nhiều niềm vui…"
            value={form.message}
            onChange={e => set({ message: e.target.value })}
            inputProps={{ maxLength: MAX_MESSAGE }}
            helperText="Hiện sau khi thổi nến, trước khi chọn quà"
          />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Quà để chọn</legend>
          <ol className={styles.gifts}>
            {form.gifts.map((g, i) => (
              <li key={g.id}>
                <TextField
                  className={styles.emoji}
                  size="small"
                  label="Icon"
                  value={g.emoji}
                  onChange={e => updateGift(g.id, { emoji: [...e.target.value].slice(-2).join('') })}
                  inputProps={{ 'aria-label': `Icon món ${i + 1}` }}
                />
                <div className={styles.giftText}>
                  <TextField
                    size="small"
                    label="Món quà"
                    value={g.title}
                    onChange={e => updateGift(g.id, { title: e.target.value })}
                    inputProps={{ maxLength: MAX_GIFT_TITLE, 'aria-label': `Món ${i + 1}` }}
                  />
                  <TextField
                    size="small"
                    label="Mô tả (không bắt buộc)"
                    value={g.note}
                    onChange={e => updateGift(g.id, { note: e.target.value })}
                    inputProps={{ maxLength: MAX_GIFT_NOTE, 'aria-label': `Mô tả món ${i + 1}` }}
                  />
                </div>
                <IconButton
                  size="small"
                  aria-label={`Bỏ món ${i + 1}`}
                  onClick={() => set({ gifts: form.gifts.filter(x => x.id !== g.id) })}
                  disabled={form.gifts.length <= MIN_GIFTS}
                >
                  <IoClose />
                </IconButton>
              </li>
            ))}
          </ol>
          {errors.gifts && <p className={styles.error}>{errors.gifts}</p>}
          {form.gifts.length < MAX_GIFTS && (
            <div className={styles.ideas}>
              {ideas.slice(0, 6).map(idea => (
                <button key={idea.title} type="button" className={styles.chip} onClick={() => set({ gifts: [...form.gifts, newGiftRow(idea)] })}>
                  <IoAdd aria-hidden /> {idea.emoji} {idea.title}
                </button>
              ))}
              <button type="button" className={styles.chip} onClick={() => set({ gifts: [...form.gifts, newGiftRow()] })}>
                <IoAdd aria-hidden /> Món khác
              </button>
            </div>
          )}
          <p className={styles.help}>{MIN_GIFTS} đến {MAX_GIFTS} món. Người ấy chọn một món, bạn nhận email ngay.</p>
        </fieldset>

        <div className={styles.actions}>
          <Button onClick={() => navigate(isEditing ? `/qua-bi-mat/${id}` : '/qua-bi-mat')}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" size="large" loading={isSaving}>
            {isEditing ? 'Lưu' : 'Tạo hộp quà 🎁'}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
