import { useEffect, useMemo, useState } from 'react';
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
import { IoAdd, IoRemove, IoSparklesOutline, IoDownloadOutline } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import { eventHeadline, invitationApi } from 'util/invitation';
import {
  DEFAULT_SEATS, MAX_SEATS, MAX_TABLE_NAME, autoSeat, nextTable, seatingPlan, seatingRows, seatsNeeded, tableLabel,
} from 'util/seating';
import { downloadCsv } from 'util/csv';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './Seating.module.scss';

/** Picks a table for one guest: one with room, a new one, or a name. */
function SeatDialog({ guest, plan, seatsPerTable, onSeat, onClose }) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const need = seatsNeeded(guest);
  const fresh = nextTable(plan.tables.map(t => t.table));

  async function pick(table) {
    setIsSaving(true);
    try {
      await onSeat(table);
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 0 }}>{guest.name}</DialogTitle>
      <p className={styles.dialogSub}>
        {[guest.group, `${need} chỗ`, guest.table && `đang ở ${tableLabel(guest.table)}`].filter(Boolean).join(' · ')}
      </p>
      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className={styles.choices} role="group" aria-label="Chọn bàn">
          {plan.tables.map(t => {
            const current = t.table === guest.table;
            const free = current ? t.free + need : t.free;
            return (
              <button
                key={t.table}
                type="button"
                aria-pressed={current}
                className={clsx(current && styles.on, free < need && styles.full)}
                disabled={isSaving}
                onClick={() => (current ? onClose() : pick(t.table))}
              >
                <strong>{tableLabel(t.table)}</strong>
                <span>{free >= need ? `còn ${free} chỗ` : `thiếu ${need - free} chỗ`}{t.group ? ` · ${t.group}` : ''}</span>
              </button>
            );
          })}
          <button type="button" className={styles.fresh} disabled={isSaving} onClick={() => pick(fresh)}>
            <strong><IoAdd aria-hidden /> {tableLabel(fresh)}</strong>
            <span>bàn mới, {seatsPerTable} chỗ</span>
          </button>
        </div>
        <form
          className={styles.named}
          onSubmit={e => {
            e.preventDefault();
            if (name.trim()) {
              pick(name.trim());
            }
          }}
        >
          <TextField
            size="small"
            fullWidth
            label="Hoặc đặt tên bàn"
            placeholder="VIP, Bàn chính..."
            value={name}
            inputProps={{ maxLength: MAX_TABLE_NAME }}
            onChange={e => setName(e.target.value)}
          />
          <Button type="submit" variant="outlined" disabled={!name.trim() || isSaving}>Xếp</Button>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {guest.table && (
          <Button color="error" onClick={() => pick('')} disabled={isSaving} sx={{ mr: 'auto' }}>Bỏ khỏi bàn</Button>
        )}
        <Button onClick={onClose} disabled={isSaving}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

/** What the automatic plan will do, before it does it. */
function AutoSeatDialog({ result, onConfirm, onClose }) {
  const [isSaving, setIsSaving] = useState(false);
  const byTable = new Map();
  for (const { guest, table } of result.seats) {
    const row = byTable.get(table) ?? { table, names: [], people: 0, groups: new Set() };
    row.names.push(guest.name);
    row.people += seatsNeeded(guest);
    if (guest.group) {
      row.groups.add(guest.group);
    }
    byTable.set(table, row);
  }
  const people = result.seats.reduce((n, s) => n + seatsNeeded(s.guest), 0);

  async function confirm() {
    setIsSaving(true);
    try {
      await onConfirm();
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tự xếp {people} người</DialogTitle>
      <DialogContent>
        <p className={styles.dialogText}>
          Mỗi nhóm ngồi bàn riêng, gia đình đông được xếp trước để không bị tách.
          {result.opened.length > 0 && ` Mở thêm ${result.opened.length} bàn mới.`} Sau đó vẫn chuyển từng người được.
        </p>
        <ul className={styles.previewList}>
          {[...byTable.values()].map(row => (
            <li key={row.table}>
              <strong>{tableLabel(row.table)}</strong>
              {row.groups.size > 0 && <span className={styles.previewGroup}>{[...row.groups].join(', ')}</span>}
              <span>+{row.people} người: {row.names.join(', ')}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
        <LoadingButton variant="contained" loading={isSaving} onClick={confirm}>Xếp bàn</LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

/**
 * The seating plan: who sits at which table. Each table shows its seats
 * taken; guests without a table wait on top. The reception desk and the
 * guest's own card show the table on the day.
 */
export default function Seating() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [moving, setMoving] = useState(null);
  const [auto, setAuto] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Xếp bàn · ${invitation.title}` });
        setEvent(invitation);
      })
      .catch(() => navigate('/events'));
  }, [eventId, navigate]);

  const guests = useMemo(() => event?.guests ?? [], [event]);
  const seatsPerTable = event?.seatsPerTable ?? DEFAULT_SEATS;
  const plan = useMemo(() => seatingPlan(guests, seatsPerTable), [guests, seatsPerTable]);
  const unseatedByGroup = useMemo(() => {
    const groups = new Map();
    for (const guest of plan.unseated) {
      const key = guest.group || '';
      groups.set(key, [...(groups.get(key) ?? []), guest]);
    }
    return [...groups].sort((a, b) => (a[0] === '') - (b[0] === ''));
  }, [plan]);

  function setTables(changes) {
    const byId = new Map(changes.map(c => [c.guest, c.table]));
    setEvent(e => ({
      ...e,
      guests: e.guests.map(g => {
        if (!byId.has(g._id)) {
          return g;
        }
        const { table, ...rest } = g;
        return byId.get(g._id) ? { ...rest, table: byId.get(g._id) } : rest;
      }),
    }));
  }

  async function changeSeats(next) {
    const value = Math.min(MAX_SEATS, Math.max(2, next));
    setEvent(e => ({ ...e, seatsPerTable: value }));
    try {
      await invitationApi.update(eventId, { seatsPerTable: value });
    } catch (err) {
      setEvent(e => ({ ...e, seatsPerTable }));
    }
  }

  async function seat(guest, table) {
    const saved = await invitationApi.updateGuest(eventId, guest._id, { table });
    setTables([{ guest: guest._id, table: saved.table ?? '' }]);
    track('guest_seated');
    toast.success(table ? `${guest.name}: ${tableLabel(saved.table)}` : `Đã bỏ ${guest.name} khỏi bàn`);
    setMoving(null);
  }

  async function applyAuto() {
    const seats = auto.seats.map(s => ({ guest: s.guest._id, table: s.table }));
    await invitationApi.seatGuests(eventId, seats);
    setTables(seats);
    track('auto_seated', { guests: seats.length, opened: auto.opened.length });
    toast.success(`Đã xếp ${seats.length} khách`);
    setAuto(null);
  }

  async function clearAll() {
    const seated = guests.filter(g => g.table);
    if (!window.confirm(`Bỏ xếp bàn cho cả ${seated.length} khách? Danh sách khách giữ nguyên.`)) {
      return;
    }
    const seats = seated.map(g => ({ guest: g._id, table: '' }));
    try {
      await invitationApi.seatGuests(eventId, seats);
      setTables(seats);
      toast.success('Đã bỏ xếp bàn');
    } catch (err) {
      console.log(err);
    }
  }

  if (!event) {
    return <OvalLoading />;
  }

  return (
    <div className={`container page ${styles.page}`}>
      <ArticleHeader back={{ to: `/events/${eventId}`, label: event.title }} eyebrow="Xếp bàn" title={eventHeadline(event)} />

      <div className={styles.summary}>
        <div><strong>{plan.tables.length}</strong><span>bàn</span></div>
        <div><strong>{plan.seated}</strong><span>người đã có chỗ</span></div>
        <div className={clsx(plan.waiting > 0 && styles.waiting)}><strong>{plan.waiting}</strong><span>người chưa có bàn</span></div>
      </div>

      <div className={styles.controls}>
        <div className={styles.seats} role="group" aria-label="Số chỗ mỗi bàn">
          <span>Mỗi bàn</span>
          <button type="button" aria-label="Bớt một chỗ" disabled={seatsPerTable <= 2} onClick={() => changeSeats(seatsPerTable - 1)}>
            <IoRemove />
          </button>
          <output aria-live="polite">{seatsPerTable} người</output>
          <button type="button" aria-label="Thêm một chỗ" disabled={seatsPerTable >= MAX_SEATS} onClick={() => changeSeats(seatsPerTable + 1)}>
            <IoAdd />
          </button>
        </div>
        <Button
          variant="contained"
          startIcon={<IoSparklesOutline />}
          disabled={plan.waiting === 0}
          onClick={() => setAuto(autoSeat(guests, seatsPerTable))}
        >
          Tự xếp người chưa có bàn
        </Button>
      </div>
      <p className={styles.hint}>
        Số chỗ theo câu trả lời của khách: báo đến 3 người thì cần 3 chỗ, chưa trả lời tính 1 chỗ, báo không đến thì
        không cần chỗ. Ngày cưới, người đón khách và thiệp của khách sẽ hiện số bàn.
      </p>

      {unseatedByGroup.length > 0 && (
        <section className={styles.unseated}>
          <h2>Chưa có bàn</h2>
          {unseatedByGroup.map(([group, list]) => (
            <div key={group} className={styles.groupRow}>
              <h3>{group || 'Chưa xếp nhóm'}</h3>
              <div className={styles.people}>
                {list.map(guest => (
                  <button key={guest._id} type="button" onClick={() => setMoving(guest)}>
                    {guest.name}{seatsNeeded(guest) > 1 && <span> · {seatsNeeded(guest)}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {plan.tables.length > 0 ? (
        <div className={styles.tables}>
          {plan.tables.map(t => (
            <section key={t.table} className={clsx(styles.table, t.free < 0 && styles.over)} aria-label={tableLabel(t.table)}>
              <header>
                <h2>{tableLabel(t.table)}</h2>
                <span className={styles.count}>{t.people}/{seatsPerTable}</span>
              </header>
              {t.group && <p className={styles.tableGroup}>{t.group}</p>}
              <ul>
                {t.guests.map(guest => (
                  <li key={guest._id}>
                    <button type="button" onClick={() => setMoving(guest)}>
                      <span>{guest.name}</span>
                      <span className={styles.need}>{seatsNeeded(guest) || '–'}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {t.free < 0 && <p className={styles.overNote}>Quá {-t.free} chỗ</p>}
            </section>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Chưa xếp bàn nào. Bấm "Tự xếp" hoặc chọn từng khách ở trên.</p>
      )}

      <div className={styles.actions}>
        {plan.tables.length > 0 && (
          <Button
            startIcon={<IoDownloadOutline />}
            onClick={() => {
              downloadCsv(`xep-ban-${dayjs(vnWallClock(event.startAt)).format('YYYY-MM-DD')}.csv`, seatingRows(guests, seatsPerTable));
              track('seating_exported');
            }}
          >
            Tải Excel
          </Button>
        )}
        {plan.tables.length > 0 && <Button color="error" onClick={clearAll}>Bỏ xếp hết</Button>}
      </div>

      {moving && (
        <SeatDialog
          key={moving._id}
          guest={moving}
          plan={plan}
          seatsPerTable={seatsPerTable}
          onSeat={table => seat(moving, table)}
          onClose={() => setMoving(null)}
        />
      )}
      {auto && <AutoSeatDialog result={auto} onConfirm={applyAuto} onClose={() => setAuto(null)} />}
    </div>
  );
}
