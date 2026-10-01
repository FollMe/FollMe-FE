import { TextEncoder, TextDecoder } from 'util';
import { decodeShareFragment, encodeShareFragment, formatBirth, toBirthPayload, toDateString } from './fortune';

// jsdom in this react-scripts version does not provide these.
global.TextEncoder = global.TextEncoder ?? TextEncoder;
global.TextDecoder = global.TextDecoder ?? TextDecoder;

jest.mock('./request', () => ({ request: {} }));

describe('share fragment', () => {
  it('round-trips Vietnamese names and birth data', () => {
    const input = {
      fullName: 'Nguyễn Thị Thùy Dương',
      birthDate: '1995-07-20',
      calendar: 'lunar',
      isLeapMonth: true,
      hourBranch: 0,
      gender: 'female',
    };
    const fragment = encodeShareFragment(input);
    expect(fragment).toMatch(/^d=[A-Za-z0-9_-]+$/);
    expect(decodeShareFragment(`#${fragment}`)).toEqual(input);
  });

  it('omits empty values', () => {
    const decoded = decodeShareFragment(`#${encodeShareFragment({ birthDate: '2000-01-02', fullName: '', isLeapMonth: false })}`);
    expect(decoded).toEqual({ birthDate: '2000-01-02' });
  });

  it('rejects garbage', () => {
    expect(decodeShareFragment('')).toBeNull();
    expect(decodeShareFragment('#d=%%%')).toBeNull();
    expect(decodeShareFragment('#d=bm90LWpzb24')).toBeNull();
    expect(decodeShareFragment(`#${encodeShareFragment({ fullName: 'No date' })}`)).toBeNull();
  });
});

describe('toBirthPayload', () => {
  it('prefers the exact time over the hour branch', () => {
    expect(toBirthPayload({ birthDate: '2000-01-02', birthTime: '10:30', hourBranch: 3, gender: 'male' })).toEqual({
      birthDate: '2000-01-02', calendar: 'solar', isLeapMonth: false, birthTime: '10:30', gender: 'male',
    });
  });

  it('keeps hour branch 0 (Tý)', () => {
    expect(toBirthPayload({ birthDate: '2000-01-02', hourBranch: 0 }).hourBranch).toBe(0);
  });
});

describe('formatting', () => {
  it('pads dates', () => {
    expect(toDateString(995, 7, 5)).toBe('0995-07-05');
  });

  it('describes a lunar birth', () => {
    expect(formatBirth({ birthDate: '1995-07-20', calendar: 'lunar', hourBranch: 5 })).toBe('20/7/1995 (âm lịch), giờ Tỵ');
  });
});

describe('almanac date helpers', () => {
  const { addDays, currentHourBranch, todayInVietnam } = require('./fortune');

  it('uses Vietnam time, not the browser time zone', () => {
    // 18:30 UTC on 30/9 is 01:30 on 1/10 in Vietnam (Sửu hour)
    const now = new Date(Date.UTC(2026, 8, 30, 18, 30));
    expect(todayInVietnam(now)).toBe('2026-10-01');
    expect(currentHourBranch(now)).toBe(1);
    // 23:10 is already Tý of the next day
    expect(currentHourBranch(new Date(Date.UTC(2026, 8, 30, 16, 10)))).toBe(0);
  });

  it('adds days across months and leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
