import {
  mascotOf, newGiftRow, recallPassword, rememberPassword, tidyGiftRows, toGiftRows, untilOpen, GIFT_IDEAS, MASCOTS,
} from './surprise';

describe('surprise', () => {
  it('falls back to the bear for an unknown mascot', () => {
    expect(mascotOf('cat').label).toBe('Mèo Mứt');
    expect(mascotOf('dragon')).toBe(MASCOTS[0]);
  });

  it('counts down to the opening, then stops', () => {
    const now = Date.UTC(2026, 10, 19, 10, 0, 0);
    const at = new Date(now + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000).toISOString();
    expect(untilOpen(at, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(untilOpen(new Date(now - 1000).toISOString(), now)).toBeNull();
    expect(untilOpen(null, now)).toBeNull();
    expect(untilOpen('not a date', now)).toBeNull();
  });

  it('keeps named gifts, on one line, with their ids', () => {
    const rows = [
      ...toGiftRows([{ _id: 'a1', title: '  Bó   hoa ', emoji: '💐' }]),
      newGiftRow(GIFT_IDEAS[0]),
      newGiftRow(),
      { ...newGiftRow(), title: 'Vé\nconcert', note: '  hàng đầu ' },
    ];
    expect(new Set(rows.map(r => r.id)).size).toBe(rows.length);
    expect(tidyGiftRows(rows)).toEqual([
      { _id: 'a1', title: 'Bó hoa', note: '', emoji: '💐' },
      { title: GIFT_IDEAS[0].title, note: '', emoji: GIFT_IDEAS[0].emoji },
      { title: 'Vé concert', note: 'hàng đầu', emoji: '🎁' },
    ]);
  });

  it('remembers the password for this tab only', () => {
    expect(recallPassword('s1')).toBeNull();
    rememberPassword('s1', '14022023');
    expect(recallPassword('s1')).toBe('14022023');
    expect(recallPassword('s2')).toBeNull();
    sessionStorage.clear();
  });
});
