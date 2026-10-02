import { fromVnWallClock, vnWallClock } from './date';

describe('vnWallClock', () => {
  it('reads as Vietnam time whatever the viewer\'s time zone', () => {
    // 04:00 UTC is 11:00 in Hà Nội
    const d = vnWallClock('2027-02-06T04:00:00Z');
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2027, 2, 6, 11, 0]);
  });

  it('rolls over to the next day in Vietnam', () => {
    // 20:30 UTC on the 5th is 03:30 on the 6th in Vietnam
    const d = vnWallClock('2027-02-05T20:30:00Z');
    expect([d.getDate(), d.getHours(), d.getMinutes(), d.getDay()]).toEqual([6, 3, 30, 6]);
  });
});

describe('fromVnWallClock', () => {
  it('reads a typed Vietnam time as the real moment, whatever the viewer\'s time zone', () => {
    // What the form holds when the host picks 11:00 on 16/01/2027
    expect(fromVnWallClock(new Date(2027, 0, 16, 11, 0)).toISOString()).toBe('2027-01-16T04:00:00.000Z');
    expect(fromVnWallClock(new Date(2027, 0, 17, 3, 30)).toISOString()).toBe('2027-01-16T20:30:00.000Z');
  });

  it('undoes vnWallClock', () => {
    for (const iso of ['2027-01-16T04:00:00.000Z', '2026-12-31T19:15:00.000Z', '2027-03-28T01:30:00.000Z']) {
      expect(fromVnWallClock(vnWallClock(iso)).toISOString()).toBe(iso);
    }
  });
});
