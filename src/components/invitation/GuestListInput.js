import { useLayoutEffect, useMemo, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { IoPeopleOutline, IoCheckmarkCircle } from 'react-icons/io5';
import {
  MAX_GUEST_NAME, MAX_GUESTS_PER_SAVE, NAME_PREFIXES, NAME_SUFFIXES,
  appendNames, lineAt, parseGuestList, withPrefix, withSuffix,
} from 'util/guestList';
import { track } from 'util/analytics';
import styles from './GuestListInput.module.scss';

// The Contact Picker (Chrome on Android): pick many people from the phone book
function canPickContacts() {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && typeof navigator.contacts?.select === 'function';
}

function names(list) {
  return list.length > 3 ? `${list.slice(0, 3).join(', ')}…` : list.join(', ');
}

/**
 * Guest names, one per line: type them, paste a list, or pick from the
 * phone book. Buttons add "Anh", "Cô"... to the line being typed.
 * `existing` are names already invited, which are not added twice.
 */
export default function GuestListInput({ value, onChange, existing = [], label = 'Danh sách khách mời', autoFocus }) {
  const inputRef = useRef(null);
  const caret = useRef(null);
  const parsed = useMemo(() => parseGuestList(value, existing), [value, existing]);
  const count = parsed.guests.length;

  // Put the caret back after a shortcut changed the text
  useLayoutEffect(() => {
    if (caret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [value]);

  function editLine(edit) {
    const input = inputRef.current;
    const at = input ? input.selectionStart : value.length;
    const { start, end } = lineAt(value, at);
    const line = edit(value.slice(start, end));
    caret.current = start + line.length;
    onChange(value.slice(0, start) + line + value.slice(end));
    input?.focus();
  }

  async function pickContacts() {
    try {
      const picked = await navigator.contacts.select(['name'], { multiple: true });
      const found = picked.map(c => c.name?.[0]).filter(Boolean);
      onChange(appendNames(value, found));
      track('guests_from_contacts', { count: found.length });
    } catch (err) {
      // Closed the picker or no permission
    }
  }

  return (
    <div className={styles.field}>
      <TextField
        inputRef={inputRef}
        label={label}
        multiline
        minRows={4}
        maxRows={14}
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        placeholder={'Cô Ba\nAnh Tuấn & người thương\nGia đình chú Tư'}
        helperText="Mỗi dòng một khách. Có thể dán cả danh sách từ Ghi chú, Zalo hay Excel."
        inputProps={{ spellCheck: false, autoCapitalize: 'words' }}
      />

      {/* onMouseDown keeps the keyboard open on phones */}
      <div className={styles.shortcuts} role="group" aria-label="Chèn nhanh vào dòng đang gõ">
        {NAME_PREFIXES.map(prefix => (
          <button
            key={prefix}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => editLine(line => withPrefix(line, prefix))}
          >
            {prefix}
          </button>
        ))}
        {NAME_SUFFIXES.map(suffix => (
          <button
            key={suffix}
            type="button"
            className={styles.suffix}
            onMouseDown={e => e.preventDefault()}
            onClick={() => editLine(line => withSuffix(line, suffix))}
          >
            {suffix}
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.count} aria-live="polite">
          {count > 0 ? (
            <>
              <IoCheckmarkCircle /><strong>{count} khách</strong>, mỗi người có một link riêng ghi tên họ
            </>
          ) : (
            'Chưa có khách nào trong danh sách'
          )}
        </p>
        {canPickContacts() && (
          <Button size="small" variant="outlined" startIcon={<IoPeopleOutline />} onClick={pickContacts}>
            Chọn từ danh bạ
          </Button>
        )}
      </div>

      {(parsed.repeated.length > 0 || parsed.alreadyInvited.length > 0) && (
        <ul className={styles.notes}>
          {parsed.repeated.length > 0 && <li>Bỏ {parsed.repeated.length} tên trùng: {names(parsed.repeated)}</li>}
          {parsed.alreadyInvited.length > 0 && (
            <li>Bỏ qua {parsed.alreadyInvited.length} người đã mời: {names(parsed.alreadyInvited)}</li>
          )}
        </ul>
      )}
      {guestListError(parsed) && <p className={styles.error}>{guestListError(parsed)}</p>}
    </div>
  );
}

/** Why the list cannot be saved as it is, or null. */
export function guestListError(parsed) {
  if (parsed.tooLong.length) {
    return `Tên khách tối đa ${MAX_GUEST_NAME} ký tự: "${parsed.tooLong[0].slice(0, 30)}…"`;
  }
  if (parsed.guests.length > MAX_GUESTS_PER_SAVE) {
    return `Mỗi lần thêm tối đa ${MAX_GUESTS_PER_SAVE} khách, danh sách đang có ${parsed.guests.length}.`;
  }
  return null;
}
