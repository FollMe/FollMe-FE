import { guestIdFromQr } from './qrScan';

describe('guestIdFromQr', () => {
  it('reads the guest from a personal link', () => {
    expect(guestIdFromQr('https://follme.vn/invitations/6ad25c93c9a4d2fcb004718e')).toBe('6ad25c93c9a4d2fcb004718e');
    expect(guestIdFromQr(' https://follme.vn/invitations/6AD25C93C9A4D2FCB004718E?lang=en ')).toBe('6ad25c93c9a4d2fcb004718e');
    expect(guestIdFromQr('http://127.0.0.1:5055/invitations/6ad25c93c9a4d2fcb004718e#loi-chuc')).toBe('6ad25c93c9a4d2fcb004718e');
  });

  it('ignores anything else', () => {
    expect(guestIdFromQr('https://follme.vn/e/6ad25c93c9a4d2fcb004718e')).toBeNull();
    expect(guestIdFromQr('https://follme.vn/c/minh-lan')).toBeNull();
    expect(guestIdFromQr('https://follme.vn/invitations/6ad25c93c9a4d2fcb004718eXX')).toBeNull();
    expect(guestIdFromQr('000201010211...VietQR')).toBeNull();
    expect(guestIdFromQr(null)).toBeNull();
  });
});
