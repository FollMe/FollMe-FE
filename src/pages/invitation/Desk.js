import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { IoSearch, IoCloseCircle, IoCheckmarkCircle, IoAdd, IoRemove, IoPersonAddOutline, IoCloudOfflineOutline } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import GroupPicker from 'components/invitation/GroupPicker';
import { eventHeadline, invitationApi, isGoneError } from 'util/invitation';
import { DESK_TABS, MAX_PARTY, deskGuests, deskSummary, mergeDesk, partySize, rsvpHint } from 'util/desk';
import { groupPresets } from 'util/guestList';
import { tableLabel } from 'util/seating';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './Desk.module.scss';

const POLL_MS = 10000;
const PAGE = 80;

function Stepper({ value, onChange, label, disabled }) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" aria-label="Bớt một người" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>
        <IoRemove />
      </button>
      <output aria-live="polite">{value} người</output>
      <button type="button" aria-label="Thêm một người" disabled={disabled || value >= MAX_PARTY} onClick={() => onChange(value + 1)}>
        <IoAdd />
      </button>
    </div>
  );
}

/** Someone who is not on the list: added and checked in at once. */
function WalkInDialog({ initialName, groups, onClose, onAdd }) {
  const [name, setName] = useState(initialName);
  const [count, setCount] = useState(1);
  const [group, setGroup] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const clean = name.replace(/\s+/g, ' ').trim();

  async function save(e) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onAdd({ name: clean, count, group });
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={save}>
        <DialogTitle>Khách không có trong danh sách</DialogTitle>
        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            fullWidth
            autoFocus
            label="Tên khách"
            value={name}
            inputProps={{ maxLength: 100 }}
            onChange={e => setName(e.target.value)}
            helperText="Ghi như cách gia đình gọi, ví dụ: Chú Ba (bạn bố)"
          />
          <div className={styles.dialogRow}>
            <span>Số người đến</span>
            <Stepper value={count} onChange={setCount} label="Số người đến" />
          </div>
          <GroupPicker value={group} onChange={setGroup} options={groups} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSaving} disabled={!clean}>Thêm, đã đến</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function GuestRow({ guest, busy, onArrive, onCount, onUndo }) {
  const arrived = Boolean(guest.arrivedAt);
  return (
    <li className={clsx(styles.row, arrived && styles.arrived)}>
      <div className={styles.who}>
        <strong>
          {arrived && <IoCheckmarkCircle className={styles.tick} aria-hidden />}
          {guest.name}
          {guest.table && <span className={styles.table}>{tableLabel(guest.table)}</span>}
        </strong>
        <span>
          {[
            guest.group,
            arrived ? `Đến lúc ${dayjs(vnWallClock(guest.arrivedAt)).format('HH:mm')}` : rsvpHint(guest),
          ].filter(Boolean).join(' · ')}
        </span>
      </div>
      {arrived ? (
        <div className={styles.actions}>
          <Stepper
            value={guest.arrivedCount || 1}
            onChange={n => onCount(guest, n)}
            label={`Số người đến cùng ${guest.name}`}
          />
          <button type="button" className={styles.undo} onClick={() => onUndo(guest)} disabled={busy}>
            {guest.source === 'desk' ? 'Xoá' : 'Huỷ'}
          </button>
        </div>
      ) : (
        <Button
          variant="contained"
          className={styles.arrive}
          onClick={() => onArrive(guest)}
          disabled={busy}
          aria-label={`${guest.name} đã đến`}
        >
          Đã đến
        </Button>
      )}
    </li>
  );
}

/**
 * The reception desk, on the phones of whoever welcomes guests (secret
 * link from the host, no account): find a guest, tap "Đã đến", fix how
 * many came. Several phones can share it; each catches up every few seconds.
 */
export default function Desk() {
  const { eventId, key } = useParams();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [status, setStatus] = useState('loading');
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState('waiting');
  const [group, setGroup] = useState(null);
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  // Checked in from this phone: stay in view until the next search
  const [keep, setKeep] = useState(() => new Set());
  const [walkIn, setWalkIn] = useState(null);
  const [busy, setBusy] = useState(() => new Set());
  // Latest request per guest: an older answer arriving late is ignored
  const seq = useRef({});
  const inFlight = useRef(new Set());
  const searchRef = useRef(null);

  const replace = useCallback(guest => setGuests(list => list.map(g => (g._id === guest._id ? guest : g))), []);

  const load = useCallback(async (poll = false) => {
    try {
      const res = await invitationApi.desk(eventId, key, poll);
      setEvent(res.event);
      setGuests(list => mergeDesk(list, res.guests, inFlight.current));
      setStatus('ready');
      setOffline(false);
      if (!poll) {
        setPageMeta({ title: `Đón khách · ${eventHeadline(res.event)}` });
      }
    } catch (err) {
      if (isGoneError(err)) {
        setStatus('gone');
      } else if (poll) {
        setOffline(true);
      } else {
        setStatus('error');
      }
    }
  }, [eventId, key]);

  useEffect(() => {
    load();
  }, [load]);

  // Catch up with the other phones while this one is in use
  useEffect(() => {
    if (status !== 'ready') {
      return undefined;
    }
    const id = setInterval(() => {
      if (!document.hidden) {
        load(true);
      }
    }, POLL_MS);
    function onVisible() {
      if (!document.hidden) {
        load(true);
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, load]);

  /** Shows the change at once, sends it, and keeps only the latest answer. */
  async function change(guest, optimistic, send) {
    const id = guest._id;
    const n = (seq.current[id] ?? 0) + 1;
    seq.current[id] = n;
    inFlight.current.add(id);
    if (optimistic) {
      replace(optimistic);
    }
    try {
      const saved = await send();
      if (seq.current[id] === n) {
        inFlight.current.delete(id);
        return saved;
      }
    } catch (err) {
      if (seq.current[id] === n) {
        inFlight.current.delete(id);
        // Back to what the server has
        load(true);
      }
      throw err;
    }
    return null;
  }

  async function arrive(guest) {
    const count = partySize(guest);
    setKeep(k => new Set(k).add(guest._id));
    track('desk_checked_in');
    try {
      const saved = await change(
        guest,
        { ...guest, arrivedAt: new Date().toISOString(), arrivedCount: count },
        () => invitationApi.setArrival(eventId, key, guest._id, { arrived: true, count }),
      );
      if (saved) {
        replace(saved);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function setCount(guest, count) {
    try {
      const saved = await change(
        guest,
        { ...guest, arrivedCount: count },
        () => invitationApi.setArrival(eventId, key, guest._id, { arrived: true, count }),
      );
      if (saved) {
        replace(saved);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function undo(guest) {
    if (guest.source === 'desk' && !window.confirm(`Xoá ${guest.name} khỏi danh sách khách?`)) {
      return;
    }
    setBusy(b => new Set(b).add(guest._id));
    try {
      if (guest.source === 'desk') {
        await change(guest, null, () => invitationApi.removeWalkIn(eventId, key, guest._id));
        setGuests(list => list.filter(g => g._id !== guest._id));
      } else {
        const { arrivedAt, arrivedCount, ...rest } = guest;
        const saved = await change(guest, rest, () => invitationApi.setArrival(eventId, key, guest._id, { arrived: false }));
        if (saved) {
          replace(saved);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setBusy(b => {
        const next = new Set(b);
        next.delete(guest._id);
        return next;
      });
    }
  }

  async function addWalkIn({ name, count, group: walkInGroup }) {
    const guest = await invitationApi.addWalkIn(eventId, key, { name, count, group: walkInGroup || undefined });
    track('desk_walk_in');
    setGuests(list => [...list, guest]);
    setKeep(new Set([guest._id]));
    setQuery('');
    setWalkIn(null);
    toast.success(`Đã thêm ${guest.name} (${guest.arrivedCount} người)`);
  }

  function search(value) {
    setQuery(value);
    setShown(PAGE);
    // A new search starts clean: guests checked in earlier leave the "Chưa đến" tab
    setKeep(new Set());
  }

  const summary = useMemo(() => deskSummary(guests), [guests]);
  const shownGuests = useMemo(() => deskGuests(guests, { tab, query, group, keep }), [guests, tab, query, group, keep]);
  const tabCounts = useMemo(
    () => Object.fromEntries(DESK_TABS.map(([k, , test]) => [k, guests.filter(test).length])),
    [guests],
  );
  const groups = useMemo(() => {
    const names = [...new Set(guests.map(g => g.group || ''))];
    return names.length > 1 || (names.length === 1 && names[0]) ? names.sort((a, b) => (a === '') - (b === '')) : [];
  }, [guests]);
  const groupOptions = useMemo(
    () => [...new Set([...groupPresets(event?.type), ...guests.map(g => g.group).filter(Boolean)])],
    [event, guests],
  );

  if (status === 'loading') {
    return <OvalLoading />;
  }
  if (status === 'gone' || status === 'error') {
    return (
      <div className={styles.message}>
        <h1>{status === 'gone' ? 'Link đón khách không còn dùng được' : 'Chưa mở được danh sách khách'}</h1>
        <p>
          {status === 'gone'
            ? 'Chủ tiệc có thể đã đổi link. Nhờ chủ tiệc gửi lại link mới trong trang quản lý thiệp.'
            : 'Kiểm tra kết nối mạng rồi thử lại.'}
        </p>
        {status === 'error' && <Button variant="contained" onClick={() => { setStatus('loading'); load(); }}>Thử lại</Button>}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.title}>
          <span>Đón khách</span>
          <h1>{eventHeadline(event)}</h1>
        </div>
        <div className={styles.counter} aria-live="polite">
          <strong>{summary.people}</strong>
          <span>người đã đến</span>
        </div>
      </header>
      <p className={styles.sub}>
        {summary.arrived}/{summary.guests} khách đã đến
        {summary.expected > 0 && ` · ${summary.expected} người báo sẽ đến`}
      </p>

      {offline && (
        <p className={styles.offline} role="status">
          <IoCloudOfflineOutline aria-hidden /> Mất kết nối, đang thử lại. Thao tác mới có thể chưa được lưu.
        </p>
      )}

      <div className={styles.tools}>
        <label className={styles.search}>
          <IoSearch aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Tìm tên khách"
            aria-label="Tìm tên khách"
            autoComplete="off"
            enterKeyHint="search"
            onChange={e => search(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.clear}
              aria-label="Xoá tìm kiếm"
              onClick={() => {
                search('');
                searchRef.current?.focus();
              }}
            >
              <IoCloseCircle />
            </button>
          )}
        </label>
        {!query && (
          <div className={styles.chips} role="tablist" aria-label="Lọc khách">
            {DESK_TABS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={clsx(tab === k && styles.on)}
                onClick={() => { setTab(k); setKeep(new Set()); setShown(PAGE); }}
              >
                {label} <span>{tabCounts[k]}</span>
              </button>
            ))}
          </div>
        )}
        {groups.length > 0 && (
          <div className={styles.chips} role="tablist" aria-label="Lọc theo nhóm">
            <button type="button" role="tab" aria-selected={group === null} className={clsx(group === null && styles.on)} onClick={() => setGroup(null)}>
              Mọi nhóm
            </button>
            {groups.map(g => (
              <button key={g} type="button" role="tab" aria-selected={group === g} className={clsx(group === g && styles.on)} onClick={() => setGroup(g)}>
                {g || 'Chưa xếp nhóm'}
              </button>
            ))}
          </div>
        )}
      </div>

      {shownGuests.length === 0 ? (
        <div className={styles.empty}>
          {query ? (
            <>
              <p>Không thấy “{query.trim()}” trong danh sách.</p>
              <Button variant="outlined" startIcon={<IoPersonAddOutline />} onClick={() => setWalkIn(query.trim())}>
                Thêm “{query.trim()}” là khách mới
              </Button>
            </>
          ) : (
            <p>{tab === 'waiting' && guests.length > 0 ? 'Khách trong danh sách đã đến đủ.' : 'Chưa có khách nào ở đây.'}</p>
          )}
        </div>
      ) : (
        <ul className={styles.rows}>
          {shownGuests.slice(0, shown).map(guest => (
            <GuestRow
              key={guest._id}
              guest={guest}
              busy={busy.has(guest._id)}
              onArrive={arrive}
              onCount={setCount}
              onUndo={undo}
            />
          ))}
        </ul>
      )}
      {shownGuests.length > shown && (
        <Button className={styles.more} onClick={() => setShown(n => n + PAGE)}>
          Xem thêm {Math.min(PAGE, shownGuests.length - shown)} khách
        </Button>
      )}

      <div className={styles.footer}>
        <Button variant="outlined" fullWidth startIcon={<IoPersonAddOutline />} onClick={() => setWalkIn(query.trim())}>
          Khách không có trong danh sách
        </Button>
      </div>

      {walkIn !== null && (
        <WalkInDialog initialName={walkIn} groups={groupOptions} onClose={() => setWalkIn(null)} onAdd={addWalkIn} />
      )}
    </div>
  );
}
