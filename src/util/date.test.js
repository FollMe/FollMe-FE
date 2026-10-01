import { vnWallClock } from './date';

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
