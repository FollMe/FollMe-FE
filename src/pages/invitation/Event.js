import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import dayjs from 'dayjs';
import {
  IoTimeOutline, IoLocationOutline, IoCopyOutline, IoCheckmark, IoEyeOutline, IoCreateOutline, IoShareSocialOutline,
  IoEyeOffOutline, IoSparkles, IoDownloadOutline, IoTvOutline, IoRefresh, IoPersonAddOutline, IoPaperPlaneOutline,
  IoNotificationsOutline, IoTrashOutline, IoPeopleOutline, IoWalletOutline, IoHeartOutline, IoGridOutline,
} from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import InvitationStatusTag from 'components/invitation/InvitationStatusTag';
import PhotoManager from 'components/invitation/PhotoManager';
import GuestListInput, { guestListError } from 'components/invitation/GuestListInput';
import GuestList from 'components/invitation/GuestList';
import GroupPicker from 'components/invitation/GroupPicker';
import SendQueue, { TemplateEditor } from 'components/invitation/SendQueue';
import {
  MAX_PHOTOS, RSVP_LABELS, deskUrl, eventHeadline, groupSummary, hasPersonalLink, invitationApi, isCoupleEvent,
  personalInvitationUrl, publicInvitationUrl, reminderQueue, screenUrl, summarizeGuests, thankQueue,
} from 'util/invitation';
import {
  deadlineText, defaultReminder, defaultTemplate, defaultThanks, loadTemplate, saveTemplate,
} from 'util/inviteMessage';
import { downloadCsv } from 'util/csv';
import { formatVnd } from 'util/gifts';
import { DEFAULT_SEATS, seatingPlan, tableLabel } from 'util/seating';
import { groupPresets, parseGuestList } from 'util/guestList';
import { vnWallClock } from 'util/date';
import { track } from 'util/analytics';
import { CONTACT_EMAIL } from 'config/constant';
import styles from "./Event.module.scss";

function CopyButton({ text, label = 'Copy link', variant = 'icon' }) {
  const [copied, setCopied] = useState(false);
  async function copy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.log(err);
    }
  }
  if (variant === 'button') {
    return (
      <Button variant="outlined" size="small" onClick={copy} startIcon={copied ? <IoCheckmark /> : <IoCopyOutline />}>
        {copied ? 'Đã copy' : label}
      </Button>
    );
  }
  return (
    <Tooltip title={copied ? 'Đã copy' : label}>
      <button type="button" className={styles.iconButton} onClick={copy} aria-label={label}>
        {copied ? <IoCheckmark /> : <IoCopyOutline />}
      </button>
    </Tooltip>
  );
}

const SOURCES = { public: 'Link chung', desk: 'Thêm tại tiệc', ledger: 'Thêm từ sổ mừng' };

/** The guest list as spreadsheet rows, for seating plans and thank-you notes. */
export function guestRows(guests) {
  return [
    [
      'Tên', 'Nhóm', 'Bàn', 'Trả lời', 'Số người', 'Lời nhắn', 'Đã đến', 'Số người đến', 'Tiền mừng', 'Ghi chú mừng', 'Nguồn',
      'Đã gửi', 'Đã nhắc', 'Đã cảm ơn', 'Lượt mở', 'Email', 'Link riêng',
    ],
    ...guests.map(g => [
      g.name,
      g.group ?? '',
      g.table ? tableLabel(g.table) : '',
      g.rsvp ? RSVP_LABELS[g.rsvp.status] : (hasPersonalLink(g) ? 'Chưa trả lời' : ''),
      g.rsvp?.status === 'attending' || g.rsvp?.status === 'maybe' ? g.rsvp.count || 1 : '',
      g.rsvp?.note ?? '',
      g.arrivedAt ? dayjs(vnWallClock(g.arrivedAt)).format('HH:mm DD/MM/YYYY') : '',
      g.arrivedAt ? g.arrivedCount || 1 : '',
      g.gift?.amount || '',
      g.gift?.note ?? '',
      SOURCES[g.source] ?? 'Mời riêng',
      g.sentAt ? 'Đã gửi' : '',
      g.remindedAt ? 'Đã nhắc' : '',
      g.thankedAt ? 'Đã cảm ơn' : '',
      g.viewed ?? 0,
      g.mail ?? '',
      hasPersonalLink(g) ? personalInvitationUrl(g._id) : '',
    ]),
  ];
}

/** Link of the wishes wall for the TV at the party, for whoever runs it. */
function ScreenPanel({ event, onEnablePublicLink }) {
  const [key, setKey] = useState(null);

  useEffect(() => {
    invitationApi.screenKey(event._id).then(res => setKey(res.key)).catch(() => setKey(null));
  }, [event._id]);

  async function rotate() {
    if (!window.confirm('Tạo link mới? Link cũ (và màn hình đang mở bằng link cũ) sẽ ngừng hoạt động.')) {
      return;
    }
    try {
      const res = await invitationApi.screenKey(event._id, true);
      setKey(res.key);
    } catch (err) {
      console.log(err);
    }
  }

  const url = key && screenUrl(event._id, key);
  return (
    <section id="man-hinh" className={clsx(styles.panel, styles.screenPanel)}>
      <div className={styles.screenIcon} aria-hidden><IoTvOutline /></div>
      <div className={styles.shareText}>
        <h2>Màn hình lời chúc tại tiệc</h2>
        <p>
          Chiếu lên TV hoặc máy chiếu ở tiệc: khách quét mã QR trên màn hình, viết lời chúc trên điện thoại và lời chúc
          hiện lên sau vài giây. Gửi link cho bên âm thanh ánh sáng, họ không cần tài khoản.
        </p>
        {!event.allowPublicLink && (
          <p className={styles.warn}>
            Mã QR trên màn hình dẫn tới link chung, đang tắt.{' '}
            <Button size="small" onClick={onEnablePublicLink}>Bật link chung</Button>
          </p>
        )}
        {url && <code className={styles.url}>{url}</code>}
        <div className={styles.shareActions}>
          {url && (
            <Button
              component="a"
              href={url}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              size="small"
              startIcon={<IoTvOutline />}
              onClick={() => track('screen_opened')}
            >
              Mở màn hình
            </Button>
          )}
          {url && <CopyButton text={url} variant="button" label="Copy link" />}
          {url && <Button size="small" startIcon={<IoRefresh />} onClick={rotate}>Đổi link</Button>}
          <Button component={Link} to={`/man-hinh/mau?theme=${event.theme || 'night'}`} target="_blank" size="small">
            Xem mẫu
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Link of the reception desk, for whoever welcomes guests at the party: they
 * check guests in on their own phone, the host sees who came.
 */
function DeskPanel({ event, summary }) {
  const [key, setKey] = useState(null);

  useEffect(() => {
    invitationApi.deskKey(event._id).then(res => setKey(res.key)).catch(() => setKey(null));
  }, [event._id]);

  async function rotate() {
    if (!window.confirm('Tạo link mới? Ai đang mở link cũ sẽ không đánh dấu khách được nữa.')) {
      return;
    }
    try {
      const res = await invitationApi.deskKey(event._id, true);
      setKey(res.key);
    } catch (err) {
      console.log(err);
    }
  }

  const url = key && deskUrl(event._id, key);

  async function share() {
    const text = `Link đón khách tiệc ${eventHeadline(event)}: tìm tên khách, bấm "Đã đến".`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Đón khách', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success('Đã copy link đón khách');
      }
      track('desk_shared');
    } catch (err) {
      // Closed the share sheet
    }
  }

  return (
    <section id="don-khach" className={clsx(styles.panel, styles.screenPanel)}>
      <div className={styles.screenIcon} aria-hidden><IoPeopleOutline /></div>
      <div className={styles.shareText}>
        <h2>
          Đón khách tại tiệc
          {summary.arrived > 0 && <span className={styles.headCount}>{summary.arrivedPeople} người đã đến</span>}
        </h2>
        <p>
          Người đứng bàn tiếp tân mở link này trên điện thoại: tìm tên khách (gõ không dấu cũng được), bấm "Đã đến" và
          ghi số người đi cùng. Nhiều người mở cùng lúc được, không cần tài khoản. Ai đã đến hiện ngay trong danh sách khách.
        </p>
        <p className={styles.muted}>Link có tên và nhóm của khách, chỉ gửi cho người nhà hoặc người bạn tin cậy.</p>
        {url && <code className={styles.url}>{url}</code>}
        <div className={styles.shareActions}>
          {url && (
            <Button
              component="a"
              href={url}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              size="small"
              startIcon={<IoPeopleOutline />}
              onClick={() => track('desk_opened')}
            >
              Mở trang đón khách
            </Button>
          )}
          {url && <Button variant="outlined" size="small" startIcon={<IoShareSocialOutline />} onClick={share}>Gửi link</Button>}
          {url && <CopyButton text={url} variant="button" label="Copy link" />}
          {url && <Button size="small" startIcon={<IoRefresh />} onClick={rotate}>Đổi link</Button>}
        </div>
      </div>
    </section>
  );
}

/**
 * The wedding-day tools at a glance, near the top of the page: each tile
 * says where it stands and leads to its own page or to its panel below.
 * After the party the gift ledger comes first.
 */
function DayTools({ event, summary, status }) {
  const plan = seatingPlan(event.guests ?? [], event.seatsPerTable ?? DEFAULT_SEATS);
  const seating = {
    key: 'seating',
    to: `/events/${event._id}/xep-ban`,
    icon: <IoGridOutline />,
    title: 'Xếp bàn',
    note: plan.tables.length === 0
      ? (summary.headcount > 0
        ? `Dự kiến ~${Math.ceil(summary.headcount / (event.seatsPerTable ?? DEFAULT_SEATS))} bàn`
        : 'Chưa xếp')
      : `${plan.tables.length} bàn${plan.waiting > 0 ? ` · ${plan.waiting} người chưa có bàn` : ', đủ chỗ'}`,
  };
  const desk = {
    key: 'desk',
    href: '#don-khach',
    icon: <IoPeopleOutline />,
    title: 'Đón khách',
    note: summary.arrived > 0 ? `${summary.arrivedPeople} người đã đến` : 'Link cho bàn tiếp tân',
  };
  const screen = {
    key: 'screen',
    href: '#man-hinh',
    icon: <IoTvOutline />,
    title: 'Màn hình lời chúc',
    note: `${(event.wishes ?? []).length} lời chúc`,
  };
  const ledger = {
    key: 'ledger',
    to: `/events/${event._id}/so-mung`,
    icon: <IoWalletOutline />,
    title: 'Sổ mừng',
    note: summary.gifts > 0 ? `${formatVnd(summary.giftTotal)} · ${summary.gifts} người` : 'Ghi sau tiệc',
  };
  const tiles = status === 'happened' ? [ledger, desk, seating, screen] : [seating, desk, screen, ledger];
  return (
    <section className={styles.tools} aria-labelledby="day-tools">
      <h2 id="day-tools">{isCoupleEvent(event.type) ? 'Ngày cưới' : 'Ngày tiệc'}</h2>
      <div className={styles.toolGrid}>
        {tiles.map(tile => {
          const inner = (
            <>
              <span className={styles.toolIcon} aria-hidden>{tile.icon}</span>
              <strong>{tile.title}</strong>
              <span className={styles.toolNote}>{tile.note}</span>
            </>
          );
          return tile.to
            ? <Link key={tile.key} to={tile.to} className={styles.tool}>{inner}</Link>
            : <a key={tile.key} href={tile.href} className={styles.tool}>{inner}</a>;
        })}
      </div>
    </section>
  );
}

/** The groups offered for guests: the usual ones, then the host's own. */
function groupOptions(event) {
  return [...new Set([...groupPresets(event.type), ...(event.guests ?? []).map(g => g.group).filter(Boolean)])];
}

/** Guests, answers and expected headcount per group, for planning tables. */
function GroupTable({ guests }) {
  const rows = groupSummary(guests);
  if (rows.length < 2 && !rows[0]?.group) {
    return null;
  }
  const anyArrived = rows.some(row => row.arrived > 0);
  return (
    <div className={styles.groupTable}>
      <table>
        <thead>
          <tr>
            <th>Nhóm</th>
            <th>Khách</th>
            <th>Trả lời</th>
            <th><abbr title="Số người dự kiến đến">Dự kiến</abbr></th>
            {anyArrived && <th><abbr title="Số người đã đến tiệc">Đã đến</abbr></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.group}>
              <td>{row.group || 'Chưa xếp nhóm'}</td>
              <td>{row.invited}</td>
              <td>{row.attending + row.maybe + row.declined}</td>
              <td><strong>{row.headcount}</strong></td>
              {anyArrived && <td><strong>{row.arrivedPeople}</strong></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Adds guests by name, without going through the edit form. */
function AddGuestsDialog({ event, onClose, onAdded }) {
  const [text, setText] = useState('');
  const [group, setGroup] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fullScreen = useMediaQuery('(max-width: 600px)');
  const existing = useMemo(() => (event.guests ?? []).map(g => g.name), [event.guests]);
  const parsed = useMemo(() => parseGuestList(text, existing, group), [text, existing, group]);
  const count = parsed.guests.length;

  async function save() {
    setIsSaving(true);
    try {
      await invitationApi.update(event._id, { addGuests: parsed.guests });
      track('guests_added', { count });
      onAdded(count);
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>Thêm khách mời</DialogTitle>
      <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <GroupPicker value={group} onChange={setGroup} options={groupOptions(event)} label="Thêm vào nhóm" />
        <GuestListInput value={text} onChange={setText} existing={existing} group={group} label="Tên khách" autoFocus />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
        <LoadingButton
          variant="contained"
          loading={isSaving}
          disabled={count === 0 || Boolean(guestListError(parsed))}
          onClick={save}
        >
          {count ? `Thêm ${count} khách` : 'Thêm khách'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

/** Deleting is for good for the guests: their links stop working. */
function DeleteEventDialog({ event, onClose }) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const summary = summarizeGuests(event.guests ?? []);
  const answered = summary.attending + summary.maybe + summary.declined;
  const losses = [
    summary.invited && `${summary.invited} khách mời${answered ? ` (${answered} người đã trả lời)` : ''}`,
    event.wishes?.length && `${event.wishes.length} lời chúc`,
    event.photos?.length && `${event.photos.length} ảnh`,
  ].filter(Boolean);

  async function remove() {
    setIsDeleting(true);
    try {
      await invitationApi.remove(event._id);
      saveTemplate(event._id, null, 'invite');
      saveTemplate(event._id, null, 'remind');
      saveTemplate(event._id, null, 'thank');
      track('event_deleted', { guests: summary.invited });
      toast.success(`Đã xoá thiệp "${event.title}"`);
      navigate('/events', { replace: true });
    } catch (err) {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open onClose={isDeleting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Xoá thiệp này?</DialogTitle>
      <DialogContent>
        <p className={styles.dialogText}>
          Link riêng của khách, link chung, màn hình lời chúc và trang đón khách sẽ không mở được nữa, ảnh bị xoá ngay.
        </p>
        {losses.length > 0 && (
          <p className={styles.dialogText}>Sẽ mất: {losses.join(', ')}.</p>
        )}
        <p className={styles.dialogText}>
          Lỡ xoá nhầm? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> trong 30 ngày để khôi phục danh sách
          khách và lời chúc.
        </p>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDeleting}>Giữ lại</Button>
        <LoadingButton variant="contained" color="error" loading={isDeleting} onClick={remove}>Xoá thiệp</LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

export default function Event() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('created') === '1';
  const [event, setEvent] = useState(null);
  const [isAddingGuests, setIsAddingGuests] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // 'invite', 'remind' or 'thank' while sending one by one / editing that message
  const [queueMode, setQueueMode] = useState(null);
  const [editingMode, setEditingMode] = useState(null);
  // The host's own messages; the defaults follow the event's details
  const [customTemplates, setCustomTemplates] = useState(() => ({
    invite: loadTemplate(eventId, 'invite'),
    remind: loadTemplate(eventId, 'remind'),
    thank: loadTemplate(eventId, 'thank'),
  }));

  const setGuests = useCallback(update => setEvent(e => ({ ...e, guests: update(e.guests ?? []) })), []);

  function changeTemplate(mode, next) {
    setCustomTemplates(t => ({ ...t, [mode]: next }));
    saveTemplate(eventId, next, mode);
  }

  const load = useCallback(() => invitationApi.hostGet(eventId)
    .then(({ invitation }) => {
      document.title = `${invitation.title} | FollMe`;
      setEvent(invitation);
    })
    .catch(() => navigate('/events')), [eventId, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  async function onGuestsAdded(count) {
    await load();
    setIsAddingGuests(false);
    toast.success(`Đã thêm ${count} khách. Bấm "Gửi lần lượt" để gửi link riêng cho từng người.`);
  }

  async function toggleWish(wish) {
    try {
      if (wish.isHidden) {
        await invitationApi.unhideWish(eventId, wish._id);
      } else {
        await invitationApi.hideWish(eventId, wish._id);
      }
      setEvent(e => ({ ...e, wishes: e.wishes.map(w => (w._id === wish._id ? { ...w, isHidden: !w.isHidden } : w)) }));
    } catch (err) {
      console.log(err);
    }
  }

  async function enablePublicLink() {
    try {
      await invitationApi.update(eventId, { allowPublicLink: true });
      setEvent(e => ({ ...e, allowPublicLink: true }));
    } catch (err) {
      console.log(err);
    }
  }

  if (!event) {
    return <OvalLoading />;
  }

  const status = new Date(event.startAt) > new Date() ? 'upcoming' : 'happened';
  const publicUrl = publicInvitationUrl(event._id);
  const guests = event.guests ?? [];
  const summary = summarizeGuests(guests);
  // Before the party: invite and nudge. After it: thank.
  const unsent = status === 'upcoming' ? guests.filter(g => hasPersonalLink(g) && !g.sentAt).length : 0;
  const toRemind = status === 'upcoming' ? reminderQueue(guests).length : 0;
  const toThank = status === 'happened' ? thankQueue(guests).length : 0;
  const templates = {
    invite: customTemplates.invite ?? defaultTemplate(event),
    remind: customTemplates.remind ?? defaultReminder(event),
    thank: customTemplates.thank ?? defaultThanks(event),
  };
  const firstPersonal = guests.find(hasPersonalLink);
  const previewUrl = event.allowPublicLink ? `/e/${event._id}` : firstPersonal && `/invitations/${firstPersonal._id}`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: eventHeadline(event), text: 'Trân trọng kính mời bạn!', url: publicUrl });
        return;
      }
      await navigator.clipboard.writeText(publicUrl);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className={`container page ${styles.page}`}>
      <ArticleHeader
        back={{ to: '/events', label: 'Thiệp của tôi' }}
        eyebrow="Thiệp mời"
        title={event.title}
        meta={[
          <><IoTimeOutline /> {dayjs(vnWallClock(event.startAt)).format('HH:mm · DD/MM/YYYY')}</>,
          <><IoLocationOutline /> {event.location}</>,
        ]}
        actions={
          <div className={styles.headActions}>
            <InvitationStatusTag status={status} />
            {previewUrl && (
              <Button component={Link} to={previewUrl} target="_blank" variant="outlined" size="small" startIcon={<IoEyeOutline />}>
                Xem thiệp
              </Button>
            )}
            <Button component={Link} to={`/events/${eventId}/edit`} variant="outlined" size="small" startIcon={<IoCreateOutline />}>
              Sửa
            </Button>
          </div>
        }
      />

      {justCreated && (
        <div className={styles.created}>
          <IoSparkles />
          <div>
            <strong>Thiệp đã sẵn sàng!</strong>
            <p>
              {(event.photos ?? []).length === 0 && 'Thêm vài tấm ảnh để thiệp có ảnh bìa và album, rồi '}
              {(event.photos ?? []).length === 0 ? 'gửi' : 'Gửi'} link chung vào nhóm Zalo, Messenger, hoặc gửi link riêng
              cho từng khách ở danh sách bên dưới.
            </p>
          </div>
        </div>
      )}

      <div className={styles.stats}>
        {[
          ['Khách mời', summary.invited],
          ['Đã gửi thiệp', summary.sent],
          ['Đã mở thiệp', summary.opened],
          ['Sẽ đến', summary.attending],
          ['Chưa chắc', summary.maybe],
          ['Không đến', summary.declined],
          ['Dự kiến số người', summary.headcount],
          summary.arrived > 0 && ['Người đã đến', summary.arrivedPeople],
        ].filter(Boolean).map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <strong>{value ?? 0}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <DayTools event={event} summary={summary} status={status} />

      <section className={clsx(styles.panel, styles.share)}>
        {event.allowPublicLink ? (
          <>
            <div className={styles.qr}>
              <QRCode value={publicUrl} size={120} />
            </div>
            <div className={styles.shareText}>
              <h2>
                Link chung
                {event.publicViews > 0 && <span className={styles.headCount}>{event.publicViews} lượt mở</span>}
              </h2>
              <p>Ai có link này đều xem được thiệp, xác nhận tham dự và gửi lời chúc. Hợp để gửi vào nhóm hoặc in mã QR lên thiệp giấy.</p>
              <code className={styles.url}>{publicUrl}</code>
              <div className={styles.shareActions}>
                <CopyButton text={publicUrl} variant="button" label="Copy link" />
                <Button variant="contained" size="small" startIcon={<IoShareSocialOutline />} onClick={share}>Chia sẻ</Button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.shareText}>
            <h2>Link chung đang tắt</h2>
            <p>Chỉ khách có link riêng mới xem được thiệp. Bật link chung để gửi vào nhóm chat.</p>
            <Button variant="contained" size="small" onClick={enablePublicLink}>Bật link chung</Button>
          </div>
        )}
      </section>


      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Khách mời <span className={styles.headCount}>{guests.length}</span></h2>
          <div className={styles.panelTools}>
            <Button size="small" variant="contained" startIcon={<IoPersonAddOutline />} onClick={() => setIsAddingGuests(true)}>
              Thêm khách
            </Button>
            {guests.length > 0 && (
              <Button
                size="small"
                startIcon={<IoDownloadOutline />}
                onClick={() => {
                  downloadCsv(`khach-moi-${dayjs(vnWallClock(event.startAt)).format('YYYY-MM-DD')}.csv`, guestRows(guests));
                  track('guests_exported');
                }}
              >
                Tải Excel
              </Button>
            )}
          </div>
        </div>
        {unsent > 0 && (
          <div className={styles.sendBar}>
            <IoPaperPlaneOutline aria-hidden />
            <div>
              <strong>{unsent} khách chưa được gửi thiệp</strong>
              <button type="button" className={styles.linkButton} onClick={() => setEditingMode('invite')}>
                Sửa lời mời
              </button>
            </div>
            <Button variant="contained" size="small" onClick={() => setQueueMode('invite')}>Gửi lần lượt</Button>
          </div>
        )}
        {toRemind > 0 && (
          <div className={styles.sendBar}>
            <IoNotificationsOutline aria-hidden />
            <div>
              <strong>{toRemind} khách chưa trả lời</strong>
              {event.rsvpBy && <span className={styles.deadline}>{deadlineText(event.rsvpBy)}</span>}
              <button type="button" className={styles.linkButton} onClick={() => setEditingMode('remind')}>
                Sửa lời nhắc
              </button>
            </div>
            <Button variant="contained" size="small" onClick={() => setQueueMode('remind')}>Nhắc lần lượt</Button>
          </div>
        )}
        {toThank > 0 && (
          <div className={styles.sendBar}>
            <IoHeartOutline aria-hidden />
            <div>
              <strong>{toThank} khách chưa được cảm ơn</strong>
              <button type="button" className={styles.linkButton} onClick={() => setEditingMode('thank')}>
                Sửa lời cảm ơn
              </button>
            </div>
            <Button variant="contained" size="small" onClick={() => setQueueMode('thank')}>Cảm ơn lần lượt</Button>
          </div>
        )}
        <GroupTable guests={guests} />
        <GuestList
          event={event}
          guests={guests}
          template={templates.invite}
          reminderTemplate={templates.remind}
          thankTemplate={templates.thank}
          groupOptions={groupOptions(event)}
          onChange={setGuests}
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Sổ lưu bút</h2>
          <span>{event.wishes?.length ?? 0} lời chúc</span>
        </div>
        {(event.wishes ?? []).length === 0 ? (
          <p className={styles.muted}>Chưa có lời chúc nào.</p>
        ) : (
          <ul className={styles.wishes}>
            {event.wishes.map(w => (
              <li key={w._id} className={clsx(w.isHidden && styles.hidden)}>
                <div>
                  <p>{w.message}</p>
                  <span>{w.name} · {dayjs(w.createdAt).format('HH:mm DD/MM')}{w.isHidden ? ' · Đang ẩn' : ''}</span>
                </div>
                <Tooltip title={w.isHidden ? 'Hiện lại' : 'Ẩn khỏi thiệp'}>
                  <button type="button" className={styles.iconButton} onClick={() => toggleWish(w)} aria-label={w.isHidden ? 'Hiện lại' : 'Ẩn lời chúc'}>
                    {w.isHidden ? <IoEyeOutline /> : <IoEyeOffOutline />}
                  </button>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>{isCoupleEvent(event.type) ? 'Ảnh cưới' : 'Hình ảnh'}</h2>
          <span>{(event.photos ?? []).length}/{MAX_PHOTOS}</span>
        </div>
        <p className={styles.panelHint}>
          Ảnh đầu tiên là ảnh bìa của thiệp, cũng là ảnh hiện ra khi gửi link qua Zalo, Messenger. Từ 2 ảnh trở lên, thiệp
          có thêm album.
        </p>
        <PhotoManager
          eventId={eventId}
          photos={event.photos ?? []}
          onChange={update => setEvent(e => ({ ...e, photos: update(e.photos ?? []) }))}
        />
      </section>

      <ScreenPanel event={event} onEnablePublicLink={enablePublicLink} />

      <DeskPanel event={event} summary={summary} />

      <section className={clsx(styles.panel, styles.dangerZone)}>
        <div>
          <h2>Xoá thiệp</h2>
          <p className={styles.muted}>Khách sẽ không mở được thiệp nữa. Ảnh bị xoá ngay, danh sách khách và lời chúc bị xoá hẳn sau 30 ngày.</p>
        </div>
        <Button color="error" variant="outlined" size="small" startIcon={<IoTrashOutline />} onClick={() => setIsConfirmingDelete(true)}>
          Xoá thiệp
        </Button>
      </section>

      {queueMode && (
        <SendQueue
          event={event}
          guests={guests}
          mode={queueMode}
          template={templates[queueMode]}
          onTemplateChange={next => changeTemplate(queueMode, next)}
          onTemplateReset={() => changeTemplate(queueMode, null)}
          onSent={guest => setGuests(list => list.map(g => (g._id === guest._id ? guest : g)))}
          onClose={() => setQueueMode(null)}
        />
      )}

      {editingMode && (
        <Dialog open onClose={() => setEditingMode(null)} fullWidth maxWidth="sm">
          <DialogTitle>{{ remind: 'Lời nhắc', thank: 'Lời cảm ơn' }[editingMode] ?? 'Lời mời'} gửi kèm link</DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            <TemplateEditor
              mode={editingMode}
              value={templates[editingMode]}
              onChange={next => changeTemplate(editingMode, next)}
              onReset={() => changeTemplate(editingMode, null)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="contained" onClick={() => setEditingMode(null)}>Xong</Button>
          </DialogActions>
        </Dialog>
      )}

      {isConfirmingDelete && <DeleteEventDialog event={event} onClose={() => setIsConfirmingDelete(false)} />}

      {isAddingGuests && (
        <AddGuestsDialog event={event} onClose={() => setIsAddingGuests(false)} onAdded={onGuestsAdded} />
      )}
    </div>
  );
}
