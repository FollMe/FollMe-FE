import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import QRCode from 'react-qr-code';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { IoPrintOutline, IoArrowBack } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import { eventHeadline, invitationApi, personalInvitationUrl } from 'util/invitation';
import { LAYOUTS, SUFFIXES, addressee, labelGuests, labelPages, nameSize } from 'util/paperLabels';
import { BOOK_ACCENTS } from 'util/guestbook';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './LabelSheet.module.scss';

/**
 * Labels for paper invitations: the guest's name to stick on the envelope
 * and a QR code to their own link, where they answer and find the way.
 * A4 label sheets; a partly used sheet can start further down.
 */
export default function LabelSheet() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [failed, setFailed] = useState(false);
  const [layoutValue, setLayoutValue] = useState(LAYOUTS[0].value);
  const [suffix, setSuffix] = useState('family');
  const [group, setGroup] = useState('');
  const [unsentOnly, setUnsentOnly] = useState(false);
  const [skip, setSkip] = useState(0);

  useEffect(() => {
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Tem thiệp giấy · ${eventHeadline(invitation)}` });
        setEvent(invitation);
      })
      .catch(() => setFailed(true));
  }, [eventId]);

  const layout = LAYOUTS.find(l => l.value === layoutValue);
  const guests = useMemo(() => labelGuests(event?.guests, { group, unsentOnly }), [event, group, unsentOnly]);
  const pages = useMemo(() => labelPages(guests, layout, skip), [guests, layout, skip]);
  const groups = useMemo(
    () => [...new Set((event?.guests ?? []).map(g => g.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [event],
  );

  if (failed) {
    return (
      <div className={styles.message}>
        <p>Không mở được danh sách khách. Hãy đăng nhập bằng tài khoản quản lý thiệp rồi thử lại.</p>
        <Button component={Link} to="/sign-in" variant="contained">Đăng nhập</Button>
      </div>
    );
  }
  if (!event) {
    return <OvalLoading />;
  }

  const perPage = layout.cols * layout.rows;
  const when = dayjs(vnWallClock(event.startAt)).format('DD.MM.YYYY');
  const headline = eventHeadline(event);
  return (
    <div
      className={styles.page}
      style={{
        '--label-accent': BOOK_ACCENTS[event.theme] ?? BOOK_ACCENTS.classic,
        '--cols': layout.cols,
        '--rows': layout.rows,
      }}
    >
      <div className={styles.toolbar}>
        <Button component={Link} to={`/events/${eventId}#khach-moi`} startIcon={<IoArrowBack />}>Quay lại</Button>
        <h1>Tem thiệp giấy</h1>
        <p className={styles.lead}>
          Dán lên phong bì thiệp giấy: tên khách và mã QR mở link riêng của họ, để xác nhận tham dự, xem đường đi và gửi
          lời chúc.
        </p>
        <div className={styles.options}>
          <TextField select size="small" label="Khổ giấy" value={layoutValue} onChange={e => setLayoutValue(e.target.value)}>
            {LAYOUTS.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Cách ghi tên" value={suffix} onChange={e => setSuffix(e.target.value)}>
            {SUFFIXES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
          {groups.length > 0 && (
            <TextField
              select
              size="small"
              label="Nhóm"
              value={group}
              onChange={e => setGroup(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">Tất cả các nhóm</MenuItem>
              {groups.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </TextField>
          )}
          <TextField
            size="small"
            type="number"
            label="Bắt đầu từ tem số"
            value={skip + 1}
            inputProps={{ min: 1, max: perPage }}
            onChange={e => setSkip(Math.min(perPage - 1, Math.max(0, (Number(e.target.value) || 1) - 1)))}
            helperText="Tờ tem đã dùng dở thì bỏ qua các ô đầu"
          />
          <FormControlLabel
            control={<Switch checked={unsentOnly} onChange={e => setUnsentOnly(e.target.checked)} />}
            label="Chỉ khách chưa gửi thiệp"
          />
        </div>
        <div className={styles.printRow}>
          <strong>{guests.length} tem · {pages.length} tờ A4</strong>
          <Button
            variant="contained"
            startIcon={<IoPrintOutline />}
            disabled={guests.length === 0}
            onClick={() => {
              track('labels_printed', { labels: guests.length, layout: layout.value });
              window.print();
            }}
          >
            In tem
          </Button>
        </div>
        <p className={styles.tip}>
          Chọn khổ A4, lề “Không có”, tỉ lệ 100%. In thử một tờ giấy thường rồi đặt lên tờ tem để canh trước.
        </p>
      </div>

      {guests.length === 0 ? (
        <p className={styles.empty}>Chưa có khách nào trong danh sách này. Thêm khách mời ở trang thiệp trước nhé.</p>
      ) : (
        <div className={styles.sheets}>
          {pages.map((cells, pageIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <section key={pageIndex} className={styles.sheet} aria-label={`Tờ ${pageIndex + 1}`}>
              {cells.map((guest, i) => {
                if (!guest) {
                  // eslint-disable-next-line react/no-array-index-key
                  return <div key={`blank-${i}`} className={styles.cell} aria-hidden />;
                }
                const name = addressee(guest.name, suffix);
                return (
                  <div key={guest._id} className={clsx(styles.cell, styles[layout.value === '2x4' ? 'big' : 'small'])}>
                    <div className={styles.text}>
                      <span className={styles.kicker}>Trân trọng kính mời</span>
                      <strong className={clsx(styles.name, styles[nameSize(name)])}>{name}</strong>
                      <span className={styles.event}>{headline} · {when}</span>
                    </div>
                    <div className={styles.qr}>
                      <QRCode value={personalInvitationUrl(guest._id)} size={256} level="M" aria-label={`Mã QR thiệp của ${guest.name}`} />
                      <span>Quét để xác nhận</span>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
