import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  IoNotificationsOutline, IoTrashOutline, IoPeopleOutline, IoWalletOutline, IoReceiptOutline, IoPrintOutline, IoListOutline, IoChevronForward, IoImageOutline, IoHeartOutline, IoGridOutline,
  IoNewspaperOutline, IoClose, IoPeopleCircleOutline, IoExitOutline, IoGiftOutline, IoNavigateOutline,
} from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import Avatar from 'components/Avatar';
import ArticleHeader from 'components/article/ArticleHeader';
import InvitationStatusTag from 'components/invitation/InvitationStatusTag';
import SaveTheDate from 'components/invitation/SaveTheDate';
import DuplicateEventDialog from 'components/invitation/DuplicateEventDialog';
import PhotoManager from 'components/invitation/PhotoManager';
import GuestListInput, { guestListError } from 'components/invitation/GuestListInput';
import GuestList from 'components/invitation/GuestList';
import GroupPicker from 'components/invitation/GroupPicker';
import SendQueue, { TemplateEditor } from 'components/invitation/SendQueue';
import ShuttlePanel from 'components/invitation/ShuttlePanel';
import {
  MAX_COHOSTS, MAX_PHOTOS, RSVP_LABELS, cohostUrl, dayOfQueue, deskUrl, eventHeadline, groupSummary, hasPersonalLink, invitationApi, isCoupleEvent,
  personalInvitationUrl, publicInvitationUrl, reminderQueue, screenUrl, summarizeGuests, thankQueue, vegetarianOf,
} from 'util/invitation';
import {
  daysToAnswer, deadlineText, defaultDayOf, defaultMessage, defaultReminder, defaultTemplate, defaultThanks, isEnglishGuest, loadTemplate, saveTemplate,
} from 'util/inviteMessage';
import { downloadCsv } from 'util/csv';
import { formatVnd, shortVnd } from 'util/gifts';
import { budgetSummary } from 'util/budget';
import { cldUrl } from 'util/photos';
import { dueText, nextTask } from 'util/checklist';
import { ago, loadSeen, newsText, saveSeen, whatsNew } from 'util/whatsNew';
import { DEFAULT_SEATS, seatingPlan, tableLabel } from 'util/seating';
import { groupPresets, parseGuestList } from 'util/guestList';
import { vnWallClock } from 'util/date';
import { track } from 'util/analytics';
import { songListText, songRequests } from 'util/songs';
import { guestShuttle } from 'util/shuttles';
import { CONTACT_EMAIL } from 'config/constant';
import { useUserInfo } from 'customHooks/useUserInfo';
import styles from "./Event.module.scss";

// Days before the party the message with the time, way and table is offered
const DAY_OF_WINDOW = 7;

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
export function guestRows(guests, event) {
  return [
    [
      'Tên', 'Nhóm', 'Bàn', 'Trả lời', 'Số người', 'Ăn chay', 'Lời nhắn', 'Bài hát', 'Xe đưa đón', 'Đã đến', 'Số người đến', 'Tiền mừng', 'Ghi chú mừng', 'Nguồn',
      'Đã gửi', 'Đã nhắc', 'Đã nhắn lịch hẹn', 'Đã cảm ơn', 'Lượt mở', 'Email', 'Link riêng',
    ],
    ...guests.map(g => [
      g.name,
      g.group ?? '',
      g.table ? tableLabel(g.table) : '',
      g.rsvp ? RSVP_LABELS[g.rsvp.status] : (hasPersonalLink(g) ? 'Chưa trả lời' : ''),
      g.rsvp?.status === 'attending' || g.rsvp?.status === 'maybe' ? g.rsvp.count || 1 : '',
      vegetarianOf(g) || '',
      g.rsvp?.note ?? '',
      g.rsvp?.song ?? '',
      guestShuttle(event, g)?.label ?? '',
      g.arrivedAt ? dayjs(vnWallClock(g.arrivedAt)).format('HH:mm DD/MM/YYYY') : '',
      g.arrivedAt ? g.arrivedCount || 1 : '',
      g.gift?.amount || '',
      g.gift?.note ?? '',
      SOURCES[g.source] ?? 'Mời riêng',
      g.sentAt ? 'Đã gửi' : '',
      g.remindedAt ? 'Đã nhắc' : '',
      g.dayOfAt ? 'Đã nhắn' : '',
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
 * Managing the event together: the host sends a link to the other half, a
 * parent or whoever runs the party; signed in, they do everything but delete
 * the event. A co-host sees who else manages it and can leave.
 */
function CohostPanel({ event, userId, onChange }) {
  const navigate = useNavigate();
  const [key, setKey] = useState(null);
  const [busy, setBusy] = useState(null);
  const cohosts = event.cohosts ?? [];
  const isHost = event.isHost !== false;
  const full = cohosts.length >= MAX_COHOSTS;

  useEffect(() => {
    if (isHost && !full) {
      invitationApi.cohostKey(event._id).then(res => setKey(res.key)).catch(() => setKey(null));
    }
  }, [event._id, isHost, full]);

  async function rotate() {
    if (!window.confirm('Tạo link mới? Link cũ sẽ không dùng được nữa, người đang cùng quản lý vẫn giữ quyền.')) {
      return;
    }
    try {
      const res = await invitationApi.cohostKey(event._id, true);
      setKey(res.key);
    } catch (err) {
      console.log(err);
    }
  }

  const url = key && !full && cohostUrl(event._id, key);

  async function share() {
    const text = `Mời bạn cùng quản lý thiệp ${eventHeadline(event)} trên FollMe: thêm khách, gửi thiệp, xem ai sẽ đến.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Cùng quản lý thiệp', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success('Đã copy link mời cùng quản lý');
      }
      track('cohost_link_shared');
    } catch (err) {
      // Closed the share sheet
    }
  }

  async function remove(person) {
    const leaving = String(person._id) === String(userId);
    const question = leaving
      ? 'Rời khỏi thiệp này? Bạn sẽ không xem và sửa được thiệp nữa, trừ khi chủ thiệp gửi lại link.'
      : `Bỏ quyền quản lý của ${person.name || 'người này'}? Họ sẽ không mở được trang quản lý thiệp nữa.`;
    if (!window.confirm(question)) {
      return;
    }
    setBusy(person._id);
    try {
      await invitationApi.removeCohost(event._id, person._id);
      if (leaving) {
        track('cohost_left');
        toast.success(`Đã rời khỏi thiệp "${event.title}"`);
        navigate('/events', { replace: true });
        return;
      }
      track('cohost_removed');
      onChange(cohosts.filter(c => String(c._id) !== String(person._id)));
    } catch (err) {
      console.log(err);
    }
    setBusy(null);
  }

  const people = [
    event.host && typeof event.host === 'object' && { ...event.host, role: 'Chủ thiệp' },
    ...cohosts.map(c => ({ ...c, role: 'Cùng quản lý' })),
  ].filter(Boolean);
  const hostName = event.host?.name || 'chủ thiệp';

  return (
    <section id="cung-quan-ly" className={clsx(styles.panel, styles.screenPanel)}>
      <div className={styles.screenIcon} aria-hidden><IoPeopleCircleOutline /></div>
      <div className={styles.shareText}>
        <h2>
          Cùng quản lý{' '}
          <span className={styles.headCount}>{cohosts.length}/{MAX_COHOSTS}</span>
        </h2>
        {isHost ? (
          <p>
            Gửi link cho nửa kia, bố mẹ hay người lo tiệc: họ đăng nhập FollMe là cùng sửa thiệp, thêm khách và gửi thiệp,
            xếp bàn, ghi sổ mừng. Chỉ bạn xoá được thiệp.
          </p>
        ) : (
          <p>Bạn đang cùng quản lý thiệp này với {hostName}. Thay đổi của bạn, mọi người cùng quản lý đều thấy.</p>
        )}
        {people.length > 1 && (
          <ul className={styles.people} aria-label="Người quản lý thiệp">
            {people.map(person => {
              const isMe = String(person._id) === String(userId);
              const canRemove = person.role !== 'Chủ thiệp' && (isHost || isMe);
              return (
                <li key={person._id}>
                  <Avatar src={person.avatar?.link} name={person.name} size={36} />
                  <span className={styles.personName}>
                    <strong>{person.name || 'Chưa đặt tên'}{isMe ? ' (bạn)' : ''}</strong>
                    <span>{person.role}</span>
                  </span>
                  {canRemove && (
                    <LoadingButton
                      size="small"
                      color={isMe ? 'inherit' : 'error'}
                      loading={busy === person._id}
                      startIcon={isMe ? <IoExitOutline /> : null}
                      onClick={() => remove(person)}
                      aria-label={isMe ? 'Rời khỏi thiệp' : `Bỏ quyền quản lý của ${person.name || 'người này'}`}
                    >
                      {isMe ? 'Rời khỏi' : 'Bỏ'}
                    </LoadingButton>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {isHost && full && <p className={styles.muted}>Đã đủ {MAX_COHOSTS} người cùng quản lý. Bỏ bớt một người để mời thêm.</p>}
        {url && (
          <>
            <p className={styles.muted}>Ai có link đều vào quản lý được, chỉ gửi cho người bạn tin cậy.</p>
            <code className={styles.url}>{url}</code>
            <div className={styles.shareActions}>
              <Button variant="contained" size="small" startIcon={<IoShareSocialOutline />} onClick={share}>Gửi link</Button>
              <CopyButton text={url} variant="button" label="Copy link" />
              <Button size="small" startIcon={<IoRefresh />} onClick={rotate}>Đổi link</Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Photos guests sent from the party: the host hides or deletes any. */
function GuestPhotosPanel({ event, onChange }) {
  const photos = event.guestPhotos ?? [];
  const [busy, setBusy] = useState(null);
  if (!photos.length) {
    return null;
  }
  const sorted = [...photos].sort((a, b) => new Date(b.at) - new Date(a.at));
  const hidden = photos.filter(p => p.hidden).length;

  async function toggle(photo) {
    setBusy(photo._id);
    try {
      await (photo.hidden ? invitationApi.showGuestPhoto : invitationApi.hideGuestPhoto)(event._id, photo._id);
      onChange(photos.map(p => (p._id === photo._id ? { ...p, hidden: !photo.hidden } : p)));
    } catch (err) {
      console.log(err);
    }
    setBusy(null);
  }

  async function remove(photo) {
    if (!window.confirm(`Xoá hẳn ảnh của ${photo.name || 'khách'}? Không lấy lại được.`)) {
      return;
    }
    setBusy(photo._id);
    try {
      await invitationApi.deleteGuestPhoto(event._id, photo._id);
      onChange(photos.filter(p => p._id !== photo._id));
    } catch (err) {
      console.log(err);
    }
    setBusy(null);
  }

  return (
    <section id="anh-khach" className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Ảnh khách gửi <span className={styles.headCount}>{photos.length}</span></h2>
        {hidden > 0 && <span className={styles.muted}>{hidden} ảnh đang ẩn</span>}
      </div>
      <p className={styles.panelHint}>Khách gửi từ thiệp của họ, ai mở thiệp cũng xem được. Ẩn những tấm bạn không muốn hiện.</p>
      <ul className={styles.guestPhotos}>
        {sorted.map(photo => (
          <li key={photo._id} className={clsx(photo.hidden && styles.hidden)}>
            <a href={cldUrl(photo.url, 'w_1600,c_limit')} target="_blank" rel="noreferrer" aria-label={`Mở ảnh của ${photo.name || 'khách'}`}>
              <img src={cldUrl(photo.url, 'w_300,h_300,c_fill,g_auto')} alt="" loading="lazy" />
            </a>
            <span className={styles.photoBy}>{photo.name}{photo.hidden ? ' · Đang ẩn' : ''}</span>
            <span className={styles.photoTools}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => toggle(photo)}
                disabled={busy === photo._id}
                aria-label={photo.hidden ? `Hiện lại ảnh của ${photo.name}` : `Ẩn ảnh của ${photo.name}`}
                title={photo.hidden ? 'Hiện lại' : 'Ẩn khỏi thiệp'}
              >
                {photo.hidden ? <IoEyeOutline /> : <IoEyeOffOutline />}
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => remove(photo)}
                disabled={busy === photo._id}
                aria-label={`Xoá ảnh của ${photo.name}`}
                title="Xoá hẳn"
              >
                <IoTrashOutline />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Songs guests asked for with their answer, to send to the band or DJ. */
function SongsPanel({ event }) {
  const requests = useMemo(() => songRequests(event.guests ?? []), [event.guests]);
  if (!requests.length) {
    return null;
  }
  return (
    <section id="bai-hat" className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Bài hát khách muốn nghe <span className={styles.headCount}>{requests.length}</span></h2>
        <div className={styles.panelTools}>
          <CopyButton text={songListText(requests, eventHeadline(event))} variant="button" label="Copy gửi ban nhạc" />
        </div>
      </div>
      <ol className={styles.songs}>
        {requests.map(r => (
          <li key={r.song}>
            <strong>{r.song}</strong>
            <span>
              {r.guests.slice(0, 3).join(', ')}
              {r.guests.length > 3 ? ` và ${r.guests.length - 3} khách khác` : ''}
            </span>
          </li>
        ))}
      </ol>
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
  const spent = budgetSummary(event.expenses ?? []).total;
  const budget = {
    key: 'budget',
    to: `/events/${event._id}/thu-chi`,
    icon: <IoReceiptOutline />,
    title: 'Thu chi',
    note: spent > 0
      ? `Chi ${shortVnd(spent)}${summary.giftTotal > 0 ? ` · mừng ${shortVnd(summary.giftTotal)}` : ''}`
      : 'Chi phí, tiền cọc',
  };
  const draw = {
    key: 'draw',
    to: `/events/${event._id}/quay-so`,
    icon: <IoGiftOutline />,
    title: 'Quay số may mắn',
    note: 'Chiếu lên màn hình lúc giao lưu',
  };
  const tiles = status === 'happened'
    ? [ledger, budget, desk, seating, screen, draw]
    : [seating, desk, screen, draw, ledger, budget];
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

/**
 * The checklist in a line: the next task and how far along it is. Before
 * the day, an invitation to make one when there is none.
 */
function NextTask({ event, isUpcoming }) {
  const tasks = event.checklist ?? [];
  const to = `/events/${event._id}/viec-can-lam`;
  if (!tasks.length) {
    return isUpcoming ? (
      <Link to={to} className={styles.nextTask}>
        <IoListOutline aria-hidden />
        <span>
          <strong>Lập danh sách việc cần làm</strong>
          Từ đặt nhà hàng tới cảm ơn khách, hạn theo ngày tiệc
        </span>
        <IoChevronForward aria-hidden />
      </Link>
    ) : null;
  }
  const next = nextTask(tasks);
  const done = tasks.filter(t => t.done).length;
  return (
    <Link to={to} className={styles.nextTask}>
      <IoListOutline aria-hidden />
      <span>
        <strong>{next ? `Việc tiếp theo: ${next.label}` : 'Đã xong hết việc cần làm'}</strong>
        {done}/{tasks.length} việc đã xong{next?.due ? ` · ${dueText(next.due)}` : ''}
      </span>
      <IoChevronForward aria-hidden />
    </Link>
  );
}

/** What came in since the host last looked: a line, and the first few names. */
function News({ event, since, onClose }) {
  const news = whatsNew(event, since);
  const text = newsText(news);
  if (!text) {
    return null;
  }
  const names = news.answers.slice(0, 3).map(g => `${g.name}: ${RSVP_LABELS[g.rsvp.status].toLowerCase()}`
    + (g.rsvp.status !== 'declined' && g.rsvp.count > 1 ? ` (${g.rsvp.count} người)` : ''));
  return (
    <div className={styles.news} role="status">
      <IoNewspaperOutline aria-hidden />
      <div>
        <strong>Từ lần trước bạn xem ({ago(since)}): {text}</strong>
        {names.length > 0 && (
          <p>{names.join(' · ')}{news.answers.length > names.length ? ` và ${news.answers.length - names.length} khách khác` : ''}</p>
        )}
      </div>
      <button type="button" className={styles.iconButton} aria-label="Đóng" onClick={onClose}><IoClose /></button>
    </div>
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
          Link riêng của khách, link chung, màn hình lời chúc và trang đón khách sẽ không mở được nữa, ảnh bị xoá ngay (trừ ảnh còn dùng ở thiệp khác của bạn).
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

/** A fresh page per event: moving to a copy starts over, its own news and messages. */
export default function Event() {
  const { eventId } = useParams();
  return <EventPage key={eventId} />;
}

function EventPage() {
  const navigate = useNavigate();
  const [userInfo] = useUserInfo();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('created') === '1';
  const [event, setEvent] = useState(null);
  const [isAddingGuests, setIsAddingGuests] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isMakingPicture, setIsMakingPicture] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  // 'invite', 'remind' or 'thank' while sending one by one / editing that message
  const [queueMode, setQueueMode] = useState(null);
  const [editingMode, setEditingMode] = useState(null);
  // The host's own messages; the defaults follow the event's details
  const [customTemplates, setCustomTemplates] = useState(() => ({
    invite: loadTemplate(eventId, 'invite'),
    remind: loadTemplate(eventId, 'remind'),
    dayof: loadTemplate(eventId, 'dayof'),
    thank: loadTemplate(eventId, 'thank'),
  }));
  // The same, for guests whose card is in English
  const [customTemplatesEn, setCustomTemplatesEn] = useState(() => Object.fromEntries(
    ['invite', 'remind', 'dayof', 'thank'].map(kind => [kind, loadTemplate(eventId, kind, 'en')]),
  ));

  // The host's previous visit on this device: what came in since is news
  const [since] = useState(() => loadSeen(eventId));
  const [newsClosed, setNewsClosed] = useState(false);
  const loaded = Boolean(event);
  useEffect(() => {
    if (loaded) {
      saveSeen(eventId);
    }
  }, [eventId, loaded]);

  // Shortcuts from other pages ("#don-khach") land on their panel
  const { hash } = useLocation();
  useEffect(() => {
    if (loaded && hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    }
  }, [loaded, hash]);

  const setGuests = useCallback(update => setEvent(e => ({ ...e, guests: update(e.guests ?? []) })), []);

  function changeTemplate(mode, next, lang = 'vi') {
    (lang === 'en' ? setCustomTemplatesEn : setCustomTemplates)(t => ({ ...t, [mode]: next }));
    saveTemplate(eventId, next, mode, lang);
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
  // The week before: time, way and table for those who said yes
  const toTellDay = status === 'upcoming' && daysToAnswer(event.startAt) <= DAY_OF_WINDOW ? dayOfQueue(guests).length : 0;
  const toThank = status === 'happened' ? thankQueue(guests).length : 0;
  const templates = {
    invite: customTemplates.invite ?? defaultTemplate(event),
    remind: customTemplates.remind ?? defaultReminder(event),
    dayof: customTemplates.dayof ?? defaultDayOf(event),
    thank: customTemplates.thank ?? defaultThanks(event),
  };
  const templatesEn = Object.fromEntries(
    ['invite', 'remind', 'dayof', 'thank'].map(kind => [kind, customTemplatesEn[kind] ?? defaultMessage(event, kind, 'en')]),
  );
  const englishGuests = guests.filter(isEnglishGuest).length;
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
          event.isHost === false && <><IoPeopleCircleOutline /> Cùng quản lý với {event.host?.name || 'chủ thiệp'}</>,
        ].filter(Boolean)}
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

      {!justCreated && !newsClosed && <News event={event} since={since} onClose={() => setNewsClosed(true)} />}

      <div className={styles.stats}>
        {[
          ['Khách mời', summary.invited],
          ['Đã gửi thiệp', summary.sent],
          ['Đã mở thiệp', summary.opened],
          ['Sẽ đến', summary.attending],
          ['Chưa chắc', summary.maybe],
          ['Không đến', summary.declined],
          ['Dự kiến số người', summary.headcount],
          summary.vegetarian > 0 && ['Suất chay', summary.vegetarian],
          summary.arrived > 0 && ['Người đã đến', summary.arrivedPeople],
        ].filter(Boolean).map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <strong>{value ?? 0}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <NextTask event={event} isUpcoming={status === 'upcoming'} />
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
                <CopyButton text={`${publicUrl}?lang=en`} variant="button" label="Link tiếng Anh" />
                <Button variant="contained" size="small" startIcon={<IoShareSocialOutline />} onClick={share}>Chia sẻ</Button>
                {status === 'upcoming' && (
                  <Button size="small" startIcon={<IoImageOutline />} onClick={() => setIsMakingPicture(true)}>
                    Ảnh save the date
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.shareText}>
            <h2>Link chung đang tắt</h2>
            <p>Chỉ khách có link riêng mới xem được thiệp. Bật link chung để gửi vào nhóm chat.</p>
            <div className={styles.shareActions}>
              <Button variant="contained" size="small" onClick={enablePublicLink}>Bật link chung</Button>
              {status === 'upcoming' && (
                <Button size="small" startIcon={<IoImageOutline />} onClick={() => setIsMakingPicture(true)}>
                  Ảnh save the date
                </Button>
              )}
            </div>
          </div>
        )}
      </section>


      <section id="khach-moi" className={styles.panel}>
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
                  downloadCsv(`khach-moi-${dayjs(vnWallClock(event.startAt)).format('YYYY-MM-DD')}.csv`, guestRows(guests, event));
                  track('guests_exported');
                }}
              >
                Tải Excel
              </Button>
            )}
            {guests.some(hasPersonalLink) && (
              <Button size="small" component={Link} to={`/events/${eventId}/tem-thiep/in`} startIcon={<IoPrintOutline />}>
                In tem thiệp giấy
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
        {toTellDay > 0 && (
          <div className={styles.sendBar}>
            <IoNavigateOutline aria-hidden />
            <div>
              <strong>Nhắn {toTellDay} khách đã nhận lời: giờ, đường đi và số bàn</strong>
              <button type="button" className={styles.linkButton} onClick={() => setEditingMode('dayof')}>
                Sửa tin nhắn
              </button>
            </div>
            <Button variant="contained" size="small" onClick={() => setQueueMode('dayof')}>Nhắn lần lượt</Button>
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
          dayOfTemplate={templates.dayof}
          thankTemplate={templates.thank}
          englishTemplates={templatesEn}
          since={since}
          groupOptions={groupOptions(event)}
          onChange={setGuests}
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Sổ lưu bút</h2>
          <div className={styles.panelTools}>
            <span>{event.wishes?.length ?? 0} lời chúc</span>
            {event.wishes?.length > 0 && (
              <Button size="small" component={Link} to={`/events/${event._id}/loi-chuc/in`} startIcon={<IoPrintOutline />}>
                In sổ lưu bút
              </Button>
            )}
          </div>
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

      <ShuttlePanel event={event} guests={guests} className={styles.panel} />

      <SongsPanel event={event} />

      <GuestPhotosPanel event={event} onChange={guestPhotos => setEvent(e => ({ ...e, guestPhotos }))} />

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

      <CohostPanel event={event} userId={userInfo._id} onChange={cohosts => setEvent(e => ({ ...e, cohosts }))} />

      <section className={clsx(styles.panel, styles.copyPanel)}>
        <div>
          <h2>Thiệp cho lễ khác</h2>
          <p className={styles.muted}>
            Nhà gái làm lễ vu quy, hay thêm tiệc báo hỷ ở quê? Tạo thiệp mới cùng mẫu, ảnh và tài khoản mừng, chỉ cần đổi tên,
            giờ và địa điểm.
          </p>
        </div>
        <Button variant="outlined" size="small" startIcon={<IoCopyOutline />} onClick={() => setIsDuplicating(true)}>
          Tạo thiệp cho lễ khác
        </Button>
      </section>

      {event.isHost !== false && (
        <section className={clsx(styles.panel, styles.dangerZone)}>
          <div>
            <h2>Xoá thiệp</h2>
            <p className={styles.muted}>Khách sẽ không mở được thiệp nữa. Ảnh bị xoá ngay (trừ ảnh còn dùng ở thiệp khác của bạn), danh sách khách và lời chúc bị xoá hẳn sau 30 ngày.</p>
          </div>
          <Button color="error" variant="outlined" size="small" startIcon={<IoTrashOutline />} onClick={() => setIsConfirmingDelete(true)}>
            Xoá thiệp
          </Button>
        </section>
      )}

      {queueMode && (
        <SendQueue
          event={event}
          guests={guests}
          mode={queueMode}
          template={templates[queueMode]}
          onTemplateChange={next => changeTemplate(queueMode, next)}
          onTemplateReset={() => changeTemplate(queueMode, null)}
          templateEn={templatesEn[queueMode]}
          onTemplateEnChange={next => changeTemplate(queueMode, next, 'en')}
          onTemplateEnReset={() => changeTemplate(queueMode, null, 'en')}
          onSent={guest => setGuests(list => list.map(g => (g._id === guest._id ? guest : g)))}
          onClose={() => setQueueMode(null)}
        />
      )}

      {editingMode && (
        <Dialog open onClose={() => setEditingMode(null)} fullWidth maxWidth="sm">
          <DialogTitle>{{ remind: 'Lời nhắc', dayof: 'Tin nhắn lịch hẹn', thank: 'Lời cảm ơn' }[editingMode] ?? 'Lời mời'} gửi kèm link</DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            <TemplateEditor
              mode={editingMode}
              value={templates[editingMode]}
              onChange={next => changeTemplate(editingMode, next)}
              onReset={() => changeTemplate(editingMode, null)}
            />
            {englishGuests > 0 && (
              <>
                <p className={styles.templateNote}>{englishGuests} khách nhận thiệp tiếng Anh sẽ nhận bản này:</p>
                <TemplateEditor
                  mode={editingMode}
                  lang="en"
                  value={templatesEn[editingMode]}
                  onChange={next => changeTemplate(editingMode, next, 'en')}
                  onReset={() => changeTemplate(editingMode, null, 'en')}
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="contained" onClick={() => setEditingMode(null)}>Xong</Button>
          </DialogActions>
        </Dialog>
      )}

      {isConfirmingDelete && <DeleteEventDialog event={event} onClose={() => setIsConfirmingDelete(false)} />}
      {isMakingPicture && <SaveTheDate event={event} onClose={() => setIsMakingPicture(false)} />}
      {isDuplicating && <DuplicateEventDialog event={event} onClose={() => setIsDuplicating(false)} />}

      {isAddingGuests && (
        <AddGuestsDialog event={event} onClose={() => setIsAddingGuests(false)} onAdded={onGuestsAdded} />
      )}
    </div>
  );
}
