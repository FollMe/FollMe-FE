import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { IoSearch, IoCloseCircle, IoPersonAddOutline, IoDownloadOutline, IoLockClosedOutline } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import GroupPicker from 'components/invitation/GroupPicker';
import { eventHeadline, invitationApi } from 'util/invitation';
import {
  LEDGER_TABS, MAX_GIFT_NOTE, QUICK_AMOUNTS, QUICK_NOTES, formatVnd, giftSummary, ledgerGuests, ledgerRows, parseAmount,
  shortVnd,
} from 'util/gifts';
import { groupPresets } from 'util/guestList';
import { downloadCsv } from 'util/csv';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './Ledger.module.scss';

const PAGE = 100;

/** What a guest gave, in a few words: "500.000 đ · Chuyển khoản". */
function giftText(gift) {
  return [gift.amount ? formatVnd(gift.amount) : '', gift.note ?? ''].filter(Boolean).join(' · ');
}

/**
 * Writes one line of the ledger. For a guest on the list (`guest`), or for
 * someone who is not (`guest` null): then their name and group are asked too.
 */
function GiftDialog({ guest, initialName = '', groups, onClose, onSave, onRemove }) {
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState('');
  const [amountText, setAmountText] = useState(guest?.gift?.amount ? formatVnd(guest.gift.amount).replace(' đ', '') : '');
  const [note, setNote] = useState(guest?.gift?.note ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const amount = parseAmount(amountText);
  const unreadable = amountText.trim() !== '' && amount === null;
  const isNew = !guest;
  const canSave = !unreadable && (amount || note.trim()) && (!isNew || name.trim());

  async function save(e) {
    e.preventDefault();
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), group, gift: { amount: amount ?? undefined, note: note.trim() || undefined } });
    } catch (err) {
      setIsSaving(false);
    }
  }

  async function remove() {
    setIsSaving(true);
    try {
      await onRemove();
    } catch (err) {
      setIsSaving(false);
    }
  }

  const sub = guest && [
    guest.group,
    guest.arrivedAt && `Đã đến${(guest.arrivedCount || 1) > 1 ? ` · ${guest.arrivedCount} người` : ''}`,
  ].filter(Boolean).join(' · ');

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs" disableRestoreFocus>
      <form onSubmit={save}>
        <DialogTitle sx={{ pb: sub ? 0 : undefined }}>{guest ? guest.name : 'Người không có trong danh sách'}</DialogTitle>
        {sub && <p className={styles.dialogSub}>{sub}</p>}
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isNew && (
            <>
              <TextField
                fullWidth
                autoFocus
                label="Tên người mừng"
                value={name}
                inputProps={{ maxLength: 100 }}
                onChange={e => setName(e.target.value)}
              />
              <GroupPicker value={group} onChange={setGroup} options={groups} />
            </>
          )}
          <div>
            <TextField
              fullWidth
              autoFocus={!isNew}
              label="Số tiền"
              placeholder="VD: 500k, 1tr2"
              value={amountText}
              error={unreadable}
              autoComplete="off"
              inputProps={{ inputMode: 'text', enterKeyHint: 'done' }}
              onChange={e => setAmountText(e.target.value)}
              helperText={
                unreadable ? 'Chưa hiểu số tiền, thử 500k hoặc 1tr2'
                  : amount ? `= ${formatVnd(amount)}`
                    : 'Để trống nếu mừng bằng quà, ghi vào ô ghi chú'
              }
              FormHelperTextProps={{ className: clsx(amount && styles.parsed) }}
            />
            <div className={styles.quick} role="group" aria-label="Số tiền hay gặp">
              {QUICK_AMOUNTS.map(value => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={amount === value}
                  className={clsx(amount === value && styles.on)}
                  onClick={() => setAmountText(shortVnd(value))}
                >
                  {shortVnd(value)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <TextField
              fullWidth
              label="Ghi chú"
              placeholder="Chuyển khoản, 1 chỉ vàng..."
              value={note}
              inputProps={{ maxLength: MAX_GIFT_NOTE }}
              onChange={e => setNote(e.target.value)}
            />
            <div className={styles.quick} role="group" aria-label="Ghi chú hay gặp">
              {QUICK_NOTES.map(value => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={note === value}
                  className={clsx(note === value && styles.on)}
                  onClick={() => setNote(note === value ? '' : value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {guest?.gift && (
            <Button color="error" onClick={remove} disabled={isSaving} sx={{ mr: 'auto' }}>Xoá khỏi sổ</Button>
          )}
          <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSaving} disabled={!canSave}>Lưu</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/**
 * The gift ledger (sổ mừng): after the party the host opens the envelopes
 * and writes down who gave what, to remember and to return the favour one
 * day. Only the host sees it.
 */
export default function Ledger() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tab, setTab] = useState('todo');
  const [group, setGroup] = useState(null);
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  // The guest being written, or { name } for someone not on the list
  const [editing, setEditing] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Sổ mừng · ${invitation.title}` });
        setEvent(invitation);
      })
      .catch(() => navigate('/events'));
  }, [eventId, navigate]);

  const guests = useMemo(() => event?.guests ?? [], [event]);
  const setGuests = useCallback(update => setEvent(e => ({ ...e, guests: update(e.guests ?? []) })), []);
  const summary = useMemo(() => giftSummary(guests), [guests]);
  const shownGuests = useMemo(() => ledgerGuests(guests, { tab, query, group }), [guests, tab, query, group]);
  const tabCounts = useMemo(
    () => Object.fromEntries(LEDGER_TABS.map(([k, , test]) => [k, guests.filter(test).length])),
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

  /** Back to the search for the next envelope. */
  function next() {
    setEditing(null);
    setQuery('');
    setShown(PAGE);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  async function save(guest, { gift }) {
    const saved = await invitationApi.updateGuest(eventId, guest._id, { gift });
    setGuests(list => list.map(g => (g._id === saved._id ? saved : g)));
    track('gift_recorded', { again: Boolean(guest.gift) });
    toast.success(`Đã ghi ${giftText(saved.gift)} · ${saved.name}`);
    next();
  }

  async function remove(guest) {
    const saved = await invitationApi.updateGuest(eventId, guest._id, { gift: null });
    setGuests(list => list.map(g => (g._id === saved._id ? saved : g)));
    toast.success(`Đã xoá ${guest.name} khỏi sổ mừng`);
    next();
  }

  async function addGiver({ name, group: giverGroup, gift }) {
    const saved = await invitationApi.addGiftGiver(eventId, { name, group: giverGroup || undefined, gift });
    setGuests(list => [...list, saved]);
    track('gift_giver_added');
    toast.success(`Đã ghi ${giftText(saved.gift)} · ${saved.name}`);
    next();
  }

  function exportLedger() {
    downloadCsv(
      `so-mung-${dayjs(vnWallClock(event.startAt)).format('YYYY-MM-DD')}.csv`,
      ledgerRows(guests, at => dayjs(vnWallClock(at)).format('HH:mm DD/MM/YYYY')),
    );
    track('ledger_exported');
  }

  if (!event) {
    return <OvalLoading />;
  }

  const trimmed = query.trim();
  return (
    <div className={`container page ${styles.page}`}>
      <ArticleHeader back={{ to: `/events/${eventId}`, label: event.title }} eyebrow="Sổ mừng" title={eventHeadline(event)} />

      <div className={styles.totals}>
        <div className={styles.total}>
          <span>Tổng tiền mừng</span>
          <strong>{formatVnd(summary.total)}</strong>
        </div>
        <div className={styles.count}>
          <strong>{summary.count}</strong>
          <span>người mừng{summary.notes > 0 ? ` · ${summary.notes} quà` : ''}</span>
        </div>
      </div>

      {summary.groups.length > 1 && (
        <table className={styles.groups}>
          <thead>
            <tr><th>Nhóm</th><th>Người mừng</th><th>Tổng</th></tr>
          </thead>
          <tbody>
            {summary.groups.map(row => (
              <tr key={row.group}>
                <td>{row.group || 'Chưa xếp nhóm'}</td>
                <td>{row.count}</td>
                <td><strong>{formatVnd(row.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className={styles.private}>
        <IoLockClosedOutline aria-hidden /> Chỉ bạn xem được sổ mừng. Khách và người đón khách không thấy.
      </p>

      <div className={styles.tools}>
        <label className={styles.search}>
          <IoSearch aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Tìm tên trên phong bì"
            aria-label="Tìm tên khách"
            autoComplete="off"
            enterKeyHint="search"
            onChange={e => { setQuery(e.target.value); setShown(PAGE); }}
            onKeyDown={e => {
              // Enter opens the only match, to write it straight away. The same
              // key press must not also submit the dialog it opens.
              if (e.key === 'Enter' && trimmed && shownGuests.length === 1) {
                e.preventDefault();
                setEditing(shownGuests[0]);
              }
            }}
          />
          {query && (
            <button type="button" className={styles.clear} aria-label="Xoá tìm kiếm" onClick={next}>
              <IoCloseCircle />
            </button>
          )}
        </label>
        {!trimmed && (
          <div className={styles.chips} role="tablist" aria-label="Lọc khách">
            {LEDGER_TABS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={clsx(tab === k && styles.on)}
                onClick={() => { setTab(k); setShown(PAGE); }}
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
          {trimmed ? (
            <>
              <p>Không thấy “{trimmed}” trong danh sách khách.</p>
              <Button variant="outlined" startIcon={<IoPersonAddOutline />} onClick={() => setEditing({ name: trimmed })}>
                Ghi “{trimmed}” là người mừng mới
              </Button>
            </>
          ) : (
            <p>
              {tab === 'todo' && guests.length > 0 ? 'Đã ghi hết khách trong danh sách.'
                : tab === 'done' ? 'Chưa ghi ai. Tìm tên trên phong bì để bắt đầu.' : 'Chưa có khách nào.'}
            </p>
          )}
        </div>
      ) : (
        <ul className={styles.rows}>
          {shownGuests.slice(0, shown).map(guest => (
            <li key={guest._id}>
              <button type="button" className={styles.row} onClick={() => setEditing(guest)}>
                <span className={styles.who}>
                  <strong>{guest.name}</strong>
                  <span>
                    {[
                      guest.group,
                      guest.arrivedAt && `Đã đến${(guest.arrivedCount || 1) > 1 ? ` · ${guest.arrivedCount} người` : ''}`,
                      guest.gift?.note,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {guest.gift ? (
                  <span className={styles.amount}>{guest.gift.amount ? formatVnd(guest.gift.amount) : 'Quà'}</span>
                ) : (
                  <span className={styles.write}>Ghi</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {shownGuests.length > shown && (
        <Button className={styles.more} onClick={() => setShown(n => n + PAGE)}>
          Xem thêm {Math.min(PAGE, shownGuests.length - shown)} khách
        </Button>
      )}

      <div className={styles.actions}>
        <Button variant="outlined" startIcon={<IoPersonAddOutline />} onClick={() => setEditing({ name: trimmed })}>
          Người không có trong danh sách
        </Button>
        {summary.count > 0 && (
          <Button startIcon={<IoDownloadOutline />} onClick={exportLedger}>Tải Excel</Button>
        )}
      </div>

      {editing && (
        <GiftDialog
          key={editing._id ?? 'new'}
          guest={editing._id ? editing : null}
          initialName={editing._id ? '' : editing.name}
          groups={groupOptions}
          onClose={() => setEditing(null)}
          onSave={values => (editing._id ? save(editing, values) : addGiver(values))}
          onRemove={() => remove(editing)}
        />
      )}
    </div>
  );
}
