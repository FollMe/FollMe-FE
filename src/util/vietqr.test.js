import { BANKS, crc16, toAccountName, toAscii, vietQrPayload } from './vietqr';

describe('crc16', () => {
  it('matches the CRC-16/CCITT-FALSE check value', () => {
    expect(crc16('123456789')).toBe('29B1');
  });
});

describe('vietQrPayload', () => {
  it('builds the NAPAS transfer-to-account layout', () => {
    // The beneficiary block of NAPAS's own example: Sacombank, 0011012345678
    const payload = vietQrPayload({ bin: '970403', account: '0011012345678' });
    expect(payload.startsWith(
      '000201010211'
      + '38570010A00000072701270006970403011300110123456780208QRIBFTTA'
      + '53037045802VN6304',
    )).toBe(true);
    expect(payload).toHaveLength(payload.lastIndexOf('6304') + 8);
  });

  it('ends with the CRC of everything before it', () => {
    const payload = vietQrPayload({ bin: '970436', account: '1234567890', message: 'Mừng cưới Minh Lan' });
    const body = payload.slice(0, -4);
    expect(payload.slice(-4)).toBe(crc16(body));
  });

  it('adds the note as ASCII, cut to 25 characters', () => {
    const payload = vietQrPayload({ bin: '970436', account: '1234567890', message: 'Cô Ba mừng cưới hai cháu Đức và Hạnh' });
    expect(payload).toContain('62280824Co Ba mung cuoi hai chau6304');
  });

  it('leaves the note out when there is none', () => {
    expect(vietQrPayload({ bin: '970436', account: '1234567890', message: '  ' })).not.toMatch(/62\d\d08/);
  });
});

describe('text helpers', () => {
  it('strips Vietnamese accents', () => {
    expect(toAscii('Đặng Thị Ánh Hồng!')).toBe('Dang Thi Anh Hong');
    expect(toAccountName('nguyễn văn minh')).toBe('NGUYEN VAN MINH');
  });
});

describe('BANKS', () => {
  it('has unique 6-digit BINs', () => {
    const bins = BANKS.map(b => b.bin);
    expect(new Set(bins).size).toBe(bins.length);
    bins.forEach(bin => expect(bin).toMatch(/^\d{6}$/));
  });
});
