import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { IoAdd, IoTrashOutline } from 'react-icons/io5';
import { BANKS, bankByBin } from 'util/vietqr';
import styles from './GiftAccountsField.module.scss';

export const SIDE_LABELS = { groom: 'Nhà trai', bride: 'Nhà gái', host: 'Gia chủ' };

/** Uppercase without accents while typing, keeping spaces. */
function typedAccountName(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .slice(0, 50);
}

/**
 * The fixed shape of gift accounts for an event type: couples have up to
 * two (groom's and bride's side), other events one (the host).
 */
export function normalizeGifts(gifts, couple) {
  if (!couple) {
    return gifts.slice(0, 1).map(g => ({ ...g, side: 'host' }));
  }
  return gifts.slice(0, 2).map((g, i) => ({ ...g, side: g.side === 'host' ? (i === 0 ? 'groom' : 'bride') : g.side }));
}

export function isGiftComplete(gift) {
  return /^\d{6}$/.test(gift.bankBin) && /^[0-9A-Za-z]{4,19}$/.test(gift.accountNumber);
}

/** Editor for the bank accounts shown in the invitation's gift box. */
export default function GiftAccountsField({ value, onChange, couple, showErrors }) {
  const gifts = normalizeGifts(value, couple);
  const max = couple ? 2 : 1;

  function update(index, patch) {
    onChange(gifts.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function add() {
    const used = gifts.map(g => g.side);
    const side = couple ? (['groom', 'bride'].find(s => !used.includes(s)) ?? 'groom') : 'host';
    onChange([...gifts, { side, bankBin: '', accountNumber: '', accountName: '' }]);
  }

  return (
    <div className={styles.field}>
      {gifts.map((gift, index) => {
        const invalid = showErrors && !isGiftComplete(gift);
        return (
          <div className={styles.account} key={index}>
            <div className={styles.head}>
              {couple ? (
                <TextField
                  select
                  size="small"
                  label="Gửi tới"
                  value={gift.side}
                  onChange={e => update(index, { side: e.target.value })}
                  sx={{ minWidth: 130 }}
                >
                  <MenuItem value="groom">{SIDE_LABELS.groom}</MenuItem>
                  <MenuItem value="bride">{SIDE_LABELS.bride}</MenuItem>
                </TextField>
              ) : (
                <strong>{SIDE_LABELS.host}</strong>
              )}
              <IconButton aria-label="Bỏ tài khoản này" onClick={() => onChange(gifts.filter((_, i) => i !== index))}>
                <IoTrashOutline />
              </IconButton>
            </div>
            <Autocomplete
              options={BANKS}
              value={bankByBin(gift.bankBin) ?? null}
              getOptionLabel={b => b.name}
              isOptionEqualToValue={(a, b) => a.bin === b.bin}
              onChange={(_, bank) => update(index, { bankBin: bank?.bin ?? '' })}
              renderInput={params => (
                <TextField {...params} label="Ngân hàng" error={invalid && !/^\d{6}$/.test(gift.bankBin)} />
              )}
            />
            <TextField
              label="Số tài khoản"
              value={gift.accountNumber}
              inputProps={{ inputMode: 'numeric', maxLength: 19 }}
              onChange={e => update(index, { accountNumber: e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 19) })}
              error={invalid && !/^[0-9A-Za-z]{4,19}$/.test(gift.accountNumber)}
            />
            <TextField
              label="Tên chủ tài khoản"
              value={gift.accountName}
              placeholder="NGUYEN VAN A"
              onChange={e => update(index, { accountName: typedAccountName(e.target.value) })}
            />
          </div>
        );
      })}
      {gifts.length < max && (
        <Button variant="outlined" startIcon={<IoAdd />} onClick={add} className={styles.add}>
          {gifts.length === 0 ? 'Thêm tài khoản nhận quà mừng' : 'Thêm tài khoản nhà còn lại'}
        </Button>
      )}
      {showErrors && gifts.some(g => !isGiftComplete(g)) && (
        <p className={styles.error}>Vui lòng chọn ngân hàng và nhập số tài khoản (hoặc bỏ tài khoản đó).</p>
      )}
      <p className={styles.help}>
        Khách quét mã QR bằng app ngân hàng bất kì, lời nhắn được điền sẵn. Hãy tự quét thử để kiểm tra trước khi gửi thiệp.
      </p>
    </div>
  );
}
