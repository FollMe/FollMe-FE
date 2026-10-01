// VietQR: the bank-transfer QR every Vietnamese banking app scans (EMVCo
// merchant-presented QR with NAPAS's "transfer to account" service).

/** Banks by NAPAS BIN, most used first. */
export const BANKS = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970426', name: 'MSB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970448', name: 'OCB' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970428', name: 'Nam A Bank' },
  { bin: '970409', name: 'Bac A Bank' },
  { bin: '970425', name: 'ABBANK' },
  { bin: '970427', name: 'VietABank' },
  { bin: '970429', name: 'SCB' },
  { bin: '970412', name: 'PVcomBank' },
  { bin: '970438', name: 'BaoViet Bank' },
  { bin: '970452', name: 'Kienlongbank' },
  { bin: '970419', name: 'NCB' },
  { bin: '970454', name: 'BVBank' },
  { bin: '970400', name: 'Saigonbank' },
  { bin: '970408', name: 'GPBank' },
  { bin: '970430', name: 'PGBank' },
  { bin: '970433', name: 'VietBank' },
  { bin: '970406', name: 'DongA Bank' },
  { bin: '970414', name: 'OceanBank' },
  { bin: '970444', name: 'CB Bank' },
  { bin: '970424', name: 'Shinhan Bank' },
  { bin: '970457', name: 'Woori Bank' },
  { bin: '970439', name: 'Public Bank' },
];

export function bankByBin(bin) {
  return BANKS.find(b => b.bin === bin);
}

/** CRC-16/CCITT-FALSE, as EMVCo QR codes require. */
export function crc16(text) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id, value) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** Vietnamese text as plain ASCII: "Mừng cưới Đức" -> "Mung cuoi Duc". */
export function toAscii(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** How banks print an account holder: "NGUYEN VAN MINH". */
export function toAccountName(text = '') {
  return toAscii(text).toUpperCase();
}

/**
 * The text of a VietQR code for a transfer to a bank account.
 *
 * @param {{ bin: string, account: string, message?: string }} opts
 *   message: prefilled transfer note, ASCII, cut to 25 characters
 */
export function vietQrPayload({ bin, account, message }) {
  const beneficiary = tlv('00', bin) + tlv('01', account);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  const note = toAscii(message).slice(0, 25).trim();
  const body = tlv('00', '01')
    + tlv('01', '11')
    + tlv('38', merchant)
    + tlv('53', '704')
    + tlv('58', 'VN')
    + (note ? tlv('62', tlv('08', note)) : '')
    + '6304';
  return body + crc16(body);
}
