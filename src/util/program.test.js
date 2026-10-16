import { addMinutes, isProgramTime, programState, programText, suggestProgram, tidyProgram } from './program';

// 17:00 on 16/01/2027 in Vietnam
const startAt = '2027-01-16T10:00:00.000Z';
const program = [
  { time: '17:00', label: 'Đón khách' },
  { time: '17:30', label: 'Làm lễ thành hôn' },
  { time: '18:00', label: 'Khai tiệc' },
];
const vn = time => new Date(`2027-01-16T${time}:00+07:00`).getTime();

describe('program', () => {
  it('suggests a first program from the start time', () => {
    expect(suggestProgram('wedding', '17:00')).toEqual(program);
    expect(suggestProgram('party', '11:15').map(i => i.time)).toEqual(['11:15', '11:45']);
    expect(suggestProgram('unknown', '09:00')[0]).toEqual({ time: '09:00', label: 'Đón khách' });
    // Nothing past midnight
    expect(suggestProgram('wedding', '23:20').map(i => i.time)).toEqual(['23:20', '23:50']);
  });

  it('adds minutes within the day', () => {
    expect(addMinutes('17:45', 30)).toBe('18:15');
    expect(addMinutes('23:30', 30)).toBeNull();
    expect(['07:05', '23:59', '24:00', '7:00', '', undefined].map(isProgramTime)).toEqual([true, true, false, false, false, false]);
  });

  it('tidies labels and sorts by time, keeping the order of equal times', () => {
    expect(tidyProgram([
      { id: 1, time: '18:00', label: ' Khai   tiệc ' },
      { id: 2, time: '17:00', label: 'Đón khách' },
      { id: 3, time: '17:15', label: '  ' },
      { id: 4, time: '17:00', label: 'Chụp ảnh' },
    ])).toEqual([
      { time: '17:00', label: 'Đón khách' },
      { time: '17:00', label: 'Chụp ảnh' },
      { time: '18:00', label: 'Khai tiệc' },
    ]);
    expect(tidyProgram()).toEqual([]);
  });

  it('knows what is under way and what comes next, on the day in Vietnam', () => {
    expect(programState(program, startAt, vn('16:00'))).toEqual({ current: -1, next: 0, isOver: false });
    expect(programState(program, startAt, vn('17:00'))).toEqual({ current: 0, next: 1, isOver: false });
    expect(programState(program, startAt, vn('17:45'))).toEqual({ current: 1, next: 2, isOver: false });
    expect(programState(program, startAt, vn('19:59'))).toEqual({ current: 2, next: -1, isOver: false });
    expect(programState(program, startAt, vn('20:00'))).toEqual({ current: -1, next: -1, isOver: true });
    // The day before
    expect(programState(program, startAt, vn('18:00') - 86400000).next).toBe(0);
    expect(programState([], startAt, vn('18:00'))).toEqual({ current: -1, next: -1, isOver: false });
  });

  it('reads as one line', () => {
    expect(programText(program)).toBe('Đón khách 17:00 · Làm lễ thành hôn 17:30 · Khai tiệc 18:00');
    expect(programText()).toBe('');
  });
});
