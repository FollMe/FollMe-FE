import { useState } from 'react';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import { MAX_SLUG, invitationApi, slugError, slugify, suggestSlug } from 'util/invitation';
import { track } from 'util/analytics';
import styles from './ShortLinkField.module.scss';

/**
 * "Link đẹp": the shared link as /c/minh-lan instead of a long id, easy
 * to read out, type, or print under the QR on a paper invitation.
 */
export default function ShortLinkField({ event, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(() => event.slug ?? suggestSlug(event));
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const error = slugError(value);
  const prefix = `${window.location.host}/c/`;

  async function save(e) {
    e.preventDefault();
    setTouched(true);
    if (error) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await invitationApi.setSlug(event._id, value);
      onChange(res.slug);
      track('short_link_set');
      toast.success('Đã đặt link đẹp');
      setIsEditing(false);
    } catch (err) {
      // Taken: the request said so
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    try {
      await invitationApi.setSlug(event._id, '');
      onChange(null);
      setValue(suggestSlug(event));
      setIsEditing(false);
    } catch (err) {
      console.log(err);
    }
  }

  if (event.slug && !isEditing) {
    return (
      <p className={styles.current}>
        Link đẹp đang dùng. Link cũ vẫn mở được.
        <button type="button" className={styles.linkButton} onClick={() => setIsEditing(true)}>Đổi</button>
      </p>
    );
  }
  if (!event.slug && !isEditing) {
    return (
      <p className={styles.current}>
        Muốn link ngắn dễ nhớ như <strong>{prefix}{suggestSlug(event) || 'ten-cua-ban'}</strong>?
        <button type="button" className={styles.linkButton} onClick={() => setIsEditing(true)}>Đặt link đẹp</button>
      </p>
    );
  }
  return (
    <form className={styles.form} onSubmit={save} noValidate>
      <label className={styles.field}>
        <span className={styles.prefix}>{prefix}</span>
        <input
          value={value}
          onChange={e => setValue(slugify(e.target.value.replace(/\s/g, '-')) + (/[-\s]$/.test(e.target.value) ? '-' : ''))}
          onBlur={() => setTouched(true)}
          maxLength={MAX_SLUG}
          aria-label="Link đẹp"
          aria-invalid={Boolean(touched && error)}
          aria-describedby="short-link-help"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      <p id="short-link-help" className={touched && error ? styles.error : styles.help}>
        {touched && error ? error : 'Chữ thường không dấu, số, dấu gạch ngang. Link cũ vẫn mở được.'}
      </p>
      <div className={styles.actions}>
        <LoadingButton type="submit" size="small" variant="contained" loading={isSaving}>Lưu link</LoadingButton>
        <Button size="small" onClick={() => { setIsEditing(false); setValue(event.slug ?? suggestSlug(event)); setTouched(false); }}>Thôi</Button>
        {event.slug && <Button size="small" color="error" onClick={remove}>Bỏ link đẹp</Button>}
      </div>
    </form>
  );
}
