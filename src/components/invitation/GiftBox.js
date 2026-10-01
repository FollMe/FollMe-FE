import { useMemo, useState } from 'react';
import clsx from 'clsx';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { IoCopyOutline, IoCheckmark } from 'react-icons/io5';
import { bankByBin, vietQrPayload } from 'util/vietqr';
import { isCoupleEvent } from 'util/invitation';
import { track } from 'util/analytics';
import styles from './GiftBox.module.scss';

const SIDE_LABELS = { groom: 'Nhà trai', bride: 'Nhà gái', host: 'Gia chủ' };

/** "0123456789" -> "0123 4567 89", easier to read out or check. */
export function groupDigits(account = '') {
  return account.replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * "Hộp mừng": a red envelope that opens on the host's bank account(s) as a
 * VietQR code, scanned by any Vietnamese banking app with the note prefilled.
 * In samples (`demo`) the code is not a real account.
 */
export default function GiftBox({ event, guest, isPublic, demo }) {
  const gifts = event.gifts ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [side, setSide] = useState(gifts[0]?.side);
  const [copied, setCopied] = useState(false);
  const couple = isCoupleEvent(event.type);
  const gift = gifts.find(g => g.side === side) ?? gifts[0];
  const sender = guest?.name && !isPublic ? guest.name : '';

  const payload = useMemo(() => {
    if (!gift) {
      return '';
    }
    if (demo) {
      return 'FollMe - thiep mau: ma QR minh hoa, khong phai tai khoan that';
    }
    const note = couple
      ? [sender, 'mung cuoi', sender ? '' : `${event.groomName ?? ''} ${event.brideName ?? ''}`].join(' ')
      : [sender, 'gui qua mung'].join(' ');
    return vietQrPayload({ bin: gift.bankBin, account: gift.accountNumber, message: note });
  }, [gift, demo, couple, sender, event.groomName, event.brideName]);

  if (!gift) {
    return null;
  }
  const bank = bankByBin(gift.bankBin);

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(gift.accountNumber);
      setCopied(true);
      toast.success('Đã chép số tài khoản');
      setTimeout(() => setCopied(false), 1600);
      track('gift_account_copied', { demo });
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className={styles.gift}>
      <h2 className={styles.title}>{couple ? 'Mừng cưới' : 'Gửi quà mừng'}</h2>
      <p className={styles.sub}>
        {couple
          ? 'Thay cho phong bì, bạn có thể gửi quà mừng tới cô dâu chú rể qua mã QR.'
          : 'Bạn có thể gửi quà mừng tới gia chủ qua mã QR.'}
      </p>

      <div className={clsx(styles.stage, isOpen && styles.open)}>
        {!isOpen ? (
          <button
            type="button"
            className={styles.packet}
            onClick={() => {
              setIsOpen(true);
              track('gift_opened', { demo });
            }}
            aria-label="Mở hộp mừng"
          >
            <span className={styles.medal} aria-hidden="true">{couple ? '囍' : '福'}</span>
            <span className={styles.packetText}>Chạm để mở</span>
          </button>
        ) : (
          <div className={styles.card}>
            {gifts.length > 1 && (
              <div className={styles.sides} role="tablist" aria-label="Gửi tới">
                {gifts.map(g => (
                  <button
                    key={g.side}
                    type="button"
                    role="tab"
                    aria-selected={g.side === gift.side}
                    className={clsx(styles.side, g.side === gift.side && styles.active)}
                    onClick={() => setSide(g.side)}
                  >
                    {SIDE_LABELS[g.side] ?? g.side}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.qr}>
              <QRCode value={payload} size={188} level="H" bgColor="#ffffff" fgColor="#1c1917" />
              <span className={styles.qrBadge} aria-hidden="true">{couple ? '囍' : '福'}</span>
              {demo && <span className={styles.sample}>Mã mẫu</span>}
            </div>
            <div className={styles.bank}>{bank?.name ?? `Ngân hàng ${gift.bankBin}`}</div>
            <button type="button" className={styles.account} onClick={copyAccount} aria-label={`Chép số tài khoản ${gift.accountNumber}`}>
              <span>{groupDigits(gift.accountNumber)}</span>
              {copied ? <IoCheckmark /> : <IoCopyOutline />}
            </button>
            {gift.accountName && <div className={styles.holder}>{gift.accountName}</div>}
            <p className={styles.hint}>
              {demo
                ? 'Đây là thiệp mẫu, mã QR chỉ để minh hoạ.'
                : 'Mở app ngân hàng và quét mã, lời nhắn đã được điền sẵn.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
