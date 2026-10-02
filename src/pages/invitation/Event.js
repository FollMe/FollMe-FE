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
  IoNotificationsOutline, IoTrashOutline,
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
  MAX_PHOTOS, RSVP_LABELS, eventHeadline, groupSummary, invitationApi, isCoupleEvent, personalInvitationUrl,
  publicInvitationUrl, reminderQueue, screenUrl, summarizeGuests,
} from 'util/invitation';
import { defaultReminder, defaultTemplate, loadTemplate, saveTemplate } from 'util/inviteMessage';
import { downloadCsv } from 'util/csv';
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

/** The guest list as spreadsheet rows, for seating plans and thank-you notes. */
export function guestRows(guests) {
  return [
    ['Tên', 'Nhóm', 'Trả lời', 'Số người', 'Lời nhắn', 'Nguồn', 'Đã gửi', 'Đã nhắc', 'Lượt mở', 'Email', 'Link riêng'],
    ...guests.map(g => [
      g.name,
      g.group ?? '',
      g.rsvp ? RSVP_LABELS[g.rsvp.status] : 'Chưa trả lời',
      g.rsvp?.status === 'attending' || g.rsvp?.status === 'maybe' ? g.rsvp.count || 1 : '',
      g.rsvp?.note ?? '',
      g.source === 'public' ? 'Link chung' : 'Mời riêng',
      g.sentAt ? 'Đã gửi' : '',
      g.remindedAt ? 'Đã nhắc' : '',
      g.viewed ?? 0,
      g.mail ?? '',
      g.source === 'public' ? '' : personalInvitationUrl(g._id),
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
    <section className={clsx(styles.panel, styles.screenPanel)}>
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
  return (
    <div className={styles.groupTable}>
      <table>
        <thead>
          <tr>
            <th>Nhóm</th>
            <th>Khách</th>
            <th>Trả lời</th>
            <th><abbr title="Số người dự kiến đến">Dự kiến</abbr></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.group}>
              <td>{row.group || 'Chưa xếp nhóm'}</td>
              <td>{row.invited}</td>
              <td>{row.invited - row.pending}</td>
              <td><strong>{row.headcount}</strong></td>
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
          Link riêng của khách, link chung và màn hình lời chúc sẽ không mở được nữa, ảnh bị xoá ngay.
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
  // 'invite' or 'remind' while sending one by one / editing that message
  const [queueMode, setQueueMode] = useState(null);
  const [editingMode, setEditingMode] = useState(null);
  // The host's own messages; the defaults follow the event's details
  const [customTemplates, setCustomTemplates] = useState(() => ({
    invite: loadTemplate(eventId, 'invite'),
    remind: loadTemplate(eventId, 'remind'),
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
  const unsent = guests.filter(g => g.source !== 'public' && !g.sentAt).length;
  const toRemind = status === 'upcoming' ? reminderQueue(guests).length : 0;
  const templates = {
    invite: customTemplates.invite ?? defaultTemplate(event),
    remind: customTemplates.remind ?? defaultReminder(event),
  };
  const firstPersonal = guests.find(g => g.source !== 'public');
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
              Thêm vài tấm ảnh cưới để thiệp có ảnh bìa và album, rồi gửi link chung vào nhóm Zalo, Messenger, hoặc copy
              link riêng của từng khách ở bảng bên dưới.
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
        ].map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <strong>{value ?? 0}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

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
              <button type="button" className={styles.linkButton} onClick={() => setEditingMode('remind')}>
                Sửa lời nhắc
              </button>
            </div>
            <Button variant="contained" size="small" onClick={() => setQueueMode('remind')}>Nhắc lần lượt</Button>
          </div>
        )}
        <GroupTable guests={guests} />
        <GuestList
          event={event}
          guests={guests}
          template={templates.invite}
          reminderTemplate={templates.remind}
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
          <DialogTitle>{editingMode === 'remind' ? 'Lời nhắc gửi kèm link' : 'Lời mời gửi kèm link'}</DialogTitle>
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
