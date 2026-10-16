import { useMemo, useState } from 'react';
import clsx from 'clsx';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { IoCopyOutline, IoCheckmark, IoCheckmarkCircle } from 'react-icons/io5';
import { bankByBin, vietQrPayload } from 'util/vietqr';
import { invitationApi, isCoupleEvent } from 'util/invitation';
import { parseAmount } from 'util/gifts';
import { track } from 'util/analytics';
import { useCardText } from './CardLang';
import styles from './GiftBox.module.scss';

const CLAIM_AMOUNTS = [300_000, 500_000, 1_000_000, 2_000_000];

/** "0123456789" -> "0123 4567 89", easier to read out or check. */
export function groupDigits(account = '') {
  return account.replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * "Mình đã chuyển khoản rồi": the guest tells the hosts, the amount if they
 * like, so it goes in the gift ledger without matching bank statements.
 */
function GiftClaim({ guest, side, couple, onGuestChange }) {
  const t = useCardText().gift;
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const amount = parseAmount(text);
  const unreadable = text.trim() !== '' && amount === null;
  const claim = guest.giftClaim;
  const who = t.who(couple);

  async function send(e) {
    e.preventDefault();
    if (unreadable) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await invitationApi.claimGift(guest._id, { amount: amount ?? undefined, side });
      onGuestChange?.({ ...guest, giftClaim: res.giftClaim });
      track('gift_claimed', { amount: Boolean(amount) });
      setIsOpen(false);
    } catch (err) {
      // The request said what went wrong
    } finally {
      setIsSaving(false);
    }
  }

  async function undo() {
    try {
      await invitationApi.withdrawGiftClaim(guest._id);
      onGuestChange?.({ ...guest, giftClaim: undefined });
      setText('');
    } catch (err) {
      console.log(err);
    }
  }

  if (claim) {
    return (
      <div className={styles.claimed} role="status">
        <IoCheckmarkCircle aria-hidden />
        <span>{t.claimed(claim.amount ? t.money(claim.amount) : '')}</span>
        <button type="button" className={styles.undo} onClick={undo}>{t.undo}</button>
      </div>
    );
  }
  if (!isOpen) {
    return (
      <button type="button" className={styles.claimButton} onClick={() => setIsOpen(true)}>
        {t.claim}
      </button>
    );
  }
  return (
    <form className={styles.claimForm} onSubmit={send}>
      <label htmlFor="gift-claim-amount">{t.amount}</label>
      <div className={styles.claimChips} role="group" aria-label={t.suggested}>
        {CLAIM_AMOUNTS.map(a => (
          <button key={a} type="button" aria-pressed={amount === a} onClick={() => setText(t.moneyInput(a))}>
            {t.shortMoney(a)}
          </button>
        ))}
      </div>
      <input
        id="gift-claim-amount"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t.placeholder}
        autoComplete="off"
        inputMode="text"
        aria-invalid={unreadable}
        aria-describedby="gift-claim-help"
      />
      <span id="gift-claim-help" className={clsx(styles.claimHelp, unreadable && styles.claimError)}>
        {unreadable ? t.unreadable : amount ? `= ${t.money(amount)}` : t.privateNote(who)}
      </span>
      <div className={styles.claimActions}>
        <button type="submit" className={styles.claimSend} disabled={isSaving || unreadable}>
          {isSaving ? t.sending : t.tell(who)}
        </button>
        <button type="button" className={styles.undo} onClick={() => setIsOpen(false)}>{t.cancel}</button>
      </div>
    </form>
  );
}

/**
 * "Hộp mừng": a red envelope that opens on the host's bank account(s) as a
 * VietQR code, scanned by any Vietnamese banking app with the note prefilled.
 * In samples (`demo`) the code is not a real account.
 */
export default function GiftBox({ event, guest, demo, onGuestChange }) {
  const t = useCardText().gift;
  const gifts = event.gifts ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [side, setSide] = useState(gifts[0]?.side);
  const [copied, setCopied] = useState(false);
  const couple = isCoupleEvent(event.type);
  const gift = gifts.find(g => g.side === side) ?? gifts[0];
  // Prefills "<name> mung cuoi" so the couple knows who sent it
  const sender = guest?.name ?? '';

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
      toast.success(t.copied);
      setTimeout(() => setCopied(false), 1600);
      track('gift_account_copied', { demo });
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className={styles.gift}>
      <h2 className={styles.title}>{t.title(couple)}</h2>
      <p className={styles.sub}>{t.sub(couple)}</p>

      <div className={clsx(styles.stage, isOpen && styles.open)}>
        {!isOpen ? (
          <button
            type="button"
            className={styles.packet}
            onClick={() => {
              setIsOpen(true);
              track('gift_opened', { demo });
            }}
            aria-label={t.open}
          >
            <span className={styles.medal} aria-hidden="true">{couple ? '囍' : '福'}</span>
            <span className={styles.packetText}>{t.tap}</span>
          </button>
        ) : (
          <div className={styles.card}>
            {gifts.length > 1 && (
              <div className={styles.sides} role="tablist" aria-label={t.sendTo}>
                {gifts.map(g => (
                  <button
                    key={g.side}
                    type="button"
                    role="tab"
                    aria-selected={g.side === gift.side}
                    className={clsx(styles.side, g.side === gift.side && styles.active)}
                    onClick={() => setSide(g.side)}
                  >
                    {t.sides[g.side] ?? g.side}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.qr}>
              <QRCode value={payload} size={188} level="H" bgColor="#ffffff" fgColor="#1c1917" />
              <span className={styles.qrBadge} aria-hidden="true">{couple ? '囍' : '福'}</span>
              {demo && <span className={styles.sample}>{t.sample}</span>}
            </div>
            <div className={styles.bank}>{bank?.name ?? t.bank(gift.bankBin)}</div>
            <button type="button" className={styles.account} onClick={copyAccount} aria-label={t.copy(gift.accountNumber)}>
              <span>{groupDigits(gift.accountNumber)}</span>
              {copied ? <IoCheckmark /> : <IoCopyOutline />}
            </button>
            {gift.accountName && <div className={styles.holder}>{gift.accountName}</div>}
            <p className={styles.hint}>
              {demo ? t.demoHint : t.hint}
            </p>
            {!demo && guest?._id && (
              <GiftClaim guest={guest} side={gifts.length > 1 ? gift.side : undefined} couple={couple} onGuestChange={onGuestChange} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
