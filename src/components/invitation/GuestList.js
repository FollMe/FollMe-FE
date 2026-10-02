import { useMemo, useState } from 'react';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import {
  IoPaperPlaneOutline, IoEllipsisHorizontal, IoCopyOutline, IoEyeOutline, IoCreateOutline, IoCheckmarkDoneOutline,
  IoArrowUndoOutline, IoTrashOutline, IoSearch,
} from 'react-icons/io5';
import { RSVP_LABELS, invitationApi, personalInvitationUrl } from 'util/invitation';
import { inviteMessage, sendInvite } from 'util/inviteMessage';
import { normalizeText } from 'util/search';
import { track } from 'util/analytics';
import styles from './GuestList.module.scss';

const PAGE = 100;

export const FILTERS = [
  ['all', 'Tất cả', () => true],
  ['unsent', 'Chưa gửi', g => g.source !== 'public' && !g.sentAt],
  ['pending', 'Chưa trả lời', g => !g.rsvp],
  ['attending', 'Sẽ đến', g => g.rsvp?.status === 'attending'],
  ['maybe', 'Chưa chắc', g => g.rsvp?.status === 'maybe'],
  ['declined', 'Không đến', g => g.rsvp?.status === 'declined'],
];

/** Guests matching the filter and the search, as typed without accents too. */
export function filterGuests(guests, filter, query) {
  const test = FILTERS.find(([key]) => key === filter)?.[2] ?? (() => true);
  const q = normalizeText(query);
  return guests.filter(g => test(g) && (!q || normalizeText(g.name).includes(q)));
}

/**
 * The host's guest list: who got their link, opened it, and answered.
 * Each personal link can be sent from here; `onChange` gets an updater.
 */
export default function GuestList({ event, guests, template, onChange }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [menu, setMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const shownGuests = useMemo(() => filterGuests(guests, filter, query), [guests, filter, query]);
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map(([key, , test]) => [key, guests.filter(test).length])),
    [guests],
  );

  // The server sends the whole guest back (an unmarked guest has no sentAt)
  function replace(guest) {
    onChange(list => list.map(g => (g._id === guest._id ? guest : g)));
  }

  async function markSent(guest, sent) {
    try {
      replace(await invitationApi.updateGuest(event._id, guest._id, { sent }));
    } catch (err) {
      console.log(err);
    }
  }

  async function send(guest) {
    const text = inviteMessage(template, guest.name, personalInvitationUrl(guest._id));
    try {
      const how = await sendInvite(text);
      track('invite_sent', { how, again: Boolean(guest.sentAt) });
      if (how === 'copied') {
        toast.success(`Đã copy lời mời cho ${guest.name}. Dán vào Zalo hoặc Messenger để gửi.`);
      }
      await markSent(guest, true);
    } catch (err) {
      // Closed the share sheet without sending
    }
  }

  async function remove(guest) {
    if (!window.confirm(`Xoá ${guest.name} khỏi danh sách? Link riêng của khách này sẽ không mở được nữa.`)) {
      return;
    }
    try {
      await invitationApi.removeGuest(event._id, guest._id);
      onChange(list => list.filter(g => g._id !== guest._id));
    } catch (err) {
      console.log(err);
    }
  }

  async function copyLink(guest) {
    try {
      await navigator.clipboard.writeText(personalInvitationUrl(guest._id));
      toast.success('Đã copy link riêng');
    } catch (err) {
      console.log(err);
    }
  }

  const menuGuest = menu?.guest;
  const personal = menuGuest && menuGuest.source !== 'public';

  return (
    <div className={styles.list}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <IoSearch aria-hidden />
          <input
            type="search"
            value={query}
            placeholder="Tìm khách"
            aria-label="Tìm khách"
            onChange={e => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
          />
        </label>
        <div className={styles.filters} role="tablist" aria-label="Lọc khách">
          {FILTERS.map(([key, label]) => (
            (key === 'all' || counts[key] > 0) && (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={clsx(filter === key && styles.on)}
                onClick={() => {
                  setFilter(key);
                  setShown(PAGE);
                }}
              >
                {label} <span>{counts[key]}</span>
              </button>
            )
          ))}
        </div>
      </div>

      {shownGuests.length === 0 ? (
        <p className={styles.empty}>
          {guests.length === 0
            ? 'Chưa có khách. Bấm "Thêm khách" để tạo link riêng ghi tên từng người, hoặc gửi link chung.'
            : 'Không có khách nào khớp.'}
        </p>
      ) : (
        <ul className={styles.rows}>
          {shownGuests.slice(0, shown).map(guest => (
            <li key={guest._id}>
              <div className={styles.who}>
                <strong>{guest.name}</strong>
                <div className={styles.tags}>
                  {guest.source === 'public' ? (
                    <span className={styles.tag}>Qua link chung</span>
                  ) : (
                    <span className={clsx(styles.tag, guest.sentAt ? styles.sent : styles.unsent)}>
                      {guest.sentAt ? 'Đã gửi' : 'Chưa gửi'}
                    </span>
                  )}
                  {guest.viewed > 0 && (
                    <span className={clsx(styles.tag, styles.opened)}>
                      Đã mở{guest.viewed > 1 ? ` ${guest.viewed} lần` : ''}
                    </span>
                  )}
                  {guest.rsvp && (
                    <span className={clsx(styles.tag, styles[guest.rsvp.status])}>
                      {RSVP_LABELS[guest.rsvp.status]}
                      {guest.rsvp.status !== 'declined' && guest.rsvp.count > 1 ? ` · ${guest.rsvp.count} người` : ''}
                    </span>
                  )}
                </div>
                {guest.rsvp?.note && <p className={styles.note}>“{guest.rsvp.note}”</p>}
              </div>
              {guest.source !== 'public' && (guest.sentAt ? (
                <IconButton size="small" aria-label={`Gửi lại cho ${guest.name}`} title="Gửi lại" onClick={() => send(guest)}>
                  <IoPaperPlaneOutline />
                </IconButton>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<IoPaperPlaneOutline />}
                  onClick={() => send(guest)}
                  className={styles.send}
                >
                  Gửi
                </Button>
              ))}
              <IconButton
                size="small"
                aria-label={`Thêm thao tác cho ${guest.name}`}
                onClick={e => setMenu({ anchor: e.currentTarget, guest })}
              >
                <IoEllipsisHorizontal />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      {shownGuests.length > shown && (
        <Button className={styles.more} onClick={() => setShown(n => n + PAGE)}>
          Xem thêm {Math.min(PAGE, shownGuests.length - shown)} khách
        </Button>
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {personal && (
          <MenuItem onClick={() => { copyLink(menuGuest); setMenu(null); }}>
            <ListItemIcon><IoCopyOutline /></ListItemIcon>Copy link riêng
          </MenuItem>
        )}
        {personal && (
          <MenuItem component="a" href={personalInvitationUrl(menuGuest._id)} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}>
            <ListItemIcon><IoEyeOutline /></ListItemIcon>Xem thiệp của khách
          </MenuItem>
        )}
        {personal && (
          <MenuItem onClick={() => { markSent(menuGuest, !menuGuest.sentAt); setMenu(null); }}>
            <ListItemIcon>{menuGuest.sentAt ? <IoArrowUndoOutline /> : <IoCheckmarkDoneOutline />}</ListItemIcon>
            {menuGuest.sentAt ? 'Đánh dấu chưa gửi' : 'Đánh dấu đã gửi'}
          </MenuItem>
        )}
        <MenuItem onClick={() => { setRenaming(menuGuest); setMenu(null); }}>
          <ListItemIcon><IoCreateOutline /></ListItemIcon>Sửa tên
        </MenuItem>
        <MenuItem onClick={() => { remove(menuGuest); setMenu(null); }} className={styles.danger}>
          <ListItemIcon><IoTrashOutline /></ListItemIcon>Xoá khách
        </MenuItem>
      </Menu>

      {renaming && (
        <RenameDialog
          event={event}
          guest={renaming}
          onClose={() => setRenaming(null)}
          onSaved={guest => {
            replace(guest);
            setRenaming(null);
          }}
        />
      )}
    </div>
  );
}

function RenameDialog({ event, guest, onClose, onSaved }) {
  const [name, setName] = useState(guest.name);
  const [isSaving, setIsSaving] = useState(false);
  const clean = name.replace(/\s+/g, ' ').trim();

  async function save(e) {
    e.preventDefault();
    if (!clean || clean === guest.name) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      onSaved(await invitationApi.updateGuest(event._id, guest._id, { name: clean }));
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={save}>
        <DialogTitle>Sửa tên khách</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            fullWidth
            autoFocus
            label="Tên trên thiệp"
            value={name}
            inputProps={{ maxLength: 100 }}
            onChange={e => setName(e.target.value)}
            helperText={guest.source === 'public' ? 'Tên khách tự nhập khi xác nhận qua link chung.' : 'Link riêng giữ nguyên, thiệp sẽ ghi tên mới.'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSaving} disabled={!clean}>Lưu</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
