import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';
import QRCode from 'react-qr-code';
import dayjs from 'dayjs';
import {
  IoTimeOutline, IoLocationOutline, IoCopyOutline, IoCheckmark, IoEyeOutline, IoCreateOutline, IoShareSocialOutline,
  IoEyeOffOutline, IoSparkles, IoDownloadOutline, IoTvOutline, IoRefresh,
} from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import InvitationStatusTag from 'components/invitation/InvitationStatusTag';
import PhotoManager from 'components/invitation/PhotoManager';
import {
  MAX_PHOTOS, RSVP_LABELS, eventHeadline, invitationApi, isCoupleEvent, personalInvitationUrl, publicInvitationUrl,
  screenUrl,
} from 'util/invitation';
import { downloadCsv } from 'util/csv';
import { track } from 'util/analytics';
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
    ['Tên', 'Trả lời', 'Số người', 'Lời nhắn', 'Nguồn', 'Lượt mở', 'Email', 'Link riêng'],
    ...guests.map(g => [
      g.name,
      g.rsvp ? RSVP_LABELS[g.rsvp.status] : 'Chưa trả lời',
      g.rsvp?.status === 'attending' || g.rsvp?.status === 'maybe' ? g.rsvp.count || 1 : '',
      g.rsvp?.note ?? '',
      g.source === 'public' ? 'Link chung' : 'Mời riêng',
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

const columns = [
  { field: 'name', headerName: 'Khách', flex: 1, minWidth: 140 },
  {
    field: 'rsvp',
    headerName: 'Trả lời',
    flex: 1,
    minWidth: 150,
    valueGetter: (params) => params.row.rsvp?.status ?? 'pending',
    renderCell: (params) => {
      const rsvp = params.row.rsvp;
      if (!rsvp) {
        return <span className={clsx(styles.pill, styles.pending)}>Chưa trả lời</span>;
      }
      return (
        <Tooltip title={rsvp.note || ''}>
          <span className={clsx(styles.pill, styles[rsvp.status])}>
            {RSVP_LABELS[rsvp.status]}{rsvp.status !== 'declined' && rsvp.count > 1 ? ` · ${rsvp.count}` : ''}
          </span>
        </Tooltip>
      );
    },
  },
  {
    field: 'source',
    headerName: 'Nguồn',
    width: 110,
    valueGetter: (params) => (params.row.source === 'public' ? 'Link chung' : 'Mời riêng'),
  },
  { field: 'viewed', headerName: 'Lượt mở', align: 'center', headerAlign: 'center', width: 100 },
  {
    field: 'action',
    headerName: '',
    sortable: false,
    width: 60,
    align: 'center',
    renderCell: (params) => (params.row.source === 'public'
      ? null
      : <CopyButton text={personalInvitationUrl(params.row._id)} label="Copy link riêng" />),
  },
];

export default function Event() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('created') === '1';
  const [event, setEvent] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        document.title = `${invitation.title} | FollMe`;
        setEvent(invitation);
      })
      .catch(() => navigate('/events'));
  }, [eventId, navigate]);

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
  const summary = event.summary ?? {};
  const publicUrl = publicInvitationUrl(event._id);
  const guests = event.guests ?? [];
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
          <><IoTimeOutline /> {dayjs(event.startAt).format('HH:mm · DD/MM/YYYY')}</>,
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
              <h2>Link chung</h2>
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
          <h2>Khách & xác nhận</h2>
          <div className={styles.panelTools}>
            <span>{guests.length} người</span>
            {guests.length > 0 && (
              <Button
                size="small"
                startIcon={<IoDownloadOutline />}
                onClick={() => {
                  downloadCsv(`khach-moi-${dayjs(event.startAt).format('YYYY-MM-DD')}.csv`, guestRows(guests));
                  track('guests_exported');
                }}
              >
                Tải danh sách
              </Button>
            )}
          </div>
        </div>
        <Box sx={{ height: 440, width: '100%' }}>
          <DataGrid
            rows={guests}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            getRowId={(row) => row._id}
            slots={{
              noRowsOverlay: () => (
                <Stack height="100%" alignItems="center" justifyContent="center">
                  <Typography>Chưa có khách. Gửi link chung hoặc thêm khách riêng trong phần Sửa.</Typography>
                </Stack>
              ),
            }}
          />
        </Box>
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
    </div>
  );
}
