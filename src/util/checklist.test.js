import {
  TASK_LINKS, dueText, eventDay, nextTask, starterTasks, taskHint, taskSections,
} from './checklist';

// 11:00 on 16/01/2027 in Vietnam
const startAt = '2027-01-16T04:00:00.000Z';
const vn = (date, time = '09:00') => new Date(`${date}T${time}:00+07:00`).getTime();

describe('eventDay', () => {
  it('is noon in Vietnam, days from the event', () => {
    expect(eventDay(startAt)).toBe('2027-01-16T05:00:00.000Z');
    expect(eventDay(startAt, -30)).toBe('2026-12-17T05:00:00.000Z');
    // 00:30 on the 17th in Vietnam is still the 17th
    expect(eventDay('2027-01-16T17:30:00.000Z', 1)).toBe('2027-01-18T05:00:00.000Z');
  });
});

describe('starterTasks', () => {
  it('counts from the event, late ones due today, in order', () => {
    const tasks = starterTasks('wedding', startAt, vn('2026-10-16'));
    expect(tasks[0]).toEqual({ label: 'Lên ngân sách đám cưới', due: '2026-10-16T05:00:00.000Z', link: 'budget' });
    const send = tasks.find(t => t.label === 'Gửi thiệp mời');
    expect(send.due).toBe('2026-12-17T05:00:00.000Z');
    expect(tasks.find(t => t.label === 'Chuẩn bị mâm quả, sính lễ').link).toBeUndefined();
    expect(tasks.at(-1)).toMatchObject({ label: 'Trả nốt các khoản chi', due: '2027-01-30T05:00:00.000Z' });
    expect(tasks.every(t => !t.link || TASK_LINKS[t.link])).toBe(true);
    const dues = tasks.map(t => t.due);
    expect([...dues].sort()).toEqual(dues);
  });

  it('has a shorter list for other events', () => {
    expect(starterTasks('engagement', startAt).length).toBeLessThan(starterTasks('wedding', startAt).length);
    expect(starterTasks('birthday', startAt)[0].label).toBe('Lên danh sách khách mời');
  });
});

describe('dueText', () => {
  const due = '2026-11-20T05:00:00.000Z';
  it('reads the days left in Vietnam', () => {
    expect(dueText(due, vn('2026-11-15'))).toBe('Còn 5 ngày · 20/11');
    expect(dueText(due, vn('2026-11-19', '23:30'))).toBe('Ngày mai');
    expect(dueText(due, vn('2026-11-20', '23:30'))).toBe('Hôm nay');
    expect(dueText(due, vn('2026-11-22'))).toBe('Trễ 2 ngày · 20/11');
    expect(dueText(due, vn('2026-09-01'))).toBe('Hạn 20/11/2026');
    expect(dueText(null)).toBe('');
  });
});

describe('taskSections and nextTask', () => {
  const now = vn('2026-11-15');
  const tasks = [
    { _id: 'later', due: '2026-12-30T05:00:00.000Z' },
    { _id: 'week2', due: '2026-11-21T05:00:00.000Z' },
    { _id: 'late', due: '2026-11-10T05:00:00.000Z' },
    { _id: 'week1', due: '2026-11-15T05:00:00.000Z' },
    { _id: 'month', due: '2026-12-01T05:00:00.000Z' },
    { _id: 'nodue' },
    { _id: 'done1', done: true, doneAt: '2026-11-01T00:00:00Z' },
    { _id: 'done2', done: true, doneAt: '2026-11-12T00:00:00Z' },
  ];

  it('sorts tasks into sections by due date', () => {
    const s = taskSections(tasks, now);
    const ids = key => s[key].map(t => t._id);
    expect(ids('late')).toEqual(['late']);
    expect(ids('week')).toEqual(['week1', 'week2']);
    expect(ids('month')).toEqual(['month']);
    expect(ids('later')).toEqual(['later', 'nodue']);
    expect(ids('done')).toEqual(['done2', 'done1']);
  });

  it('picks the next task', () => {
    expect(nextTask(tasks)._id).toBe('late');
    expect(nextTask([{ _id: 'x', done: true }])).toBeNull();
    expect(nextTask()).toBeNull();
  });
});

describe('taskHint', () => {
  const event = {
    seatsPerTable: 10,
    program: [{ time: '11:00', label: 'Đón khách' }],
    guests: [
      { name: 'A', sentAt: '2026-11-01', rsvp: { status: 'attending', count: 2 }, table: '1', thankedAt: '2027-01-18' },
      { name: 'B', sentAt: '2026-11-01' },
      { name: 'C', rsvp: { status: 'attending', count: 1 } },
      { name: 'D', source: 'desk', arrivedAt: '2027-01-16', gift: { amount: 500000 } },
    ],
    expenses: [{ label: 'Tiệc' }],
  };
  it('tells where each tool stands', () => {
    const hint = link => taskHint({ link }, event);
    expect(hint('guests')).toBe('4 khách');
    expect(hint('send')).toBe('Đã gửi 2/3');
    expect(hint('remind')).toBe('1 khách chưa trả lời');
    expect(hint('seating')).toBe('1 bàn · 3 người chưa có bàn');
    expect(hint('program')).toBe('1 mục');
    expect(hint('photos')).toBe('');
    expect(hint('budget')).toBe('1 khoản chi');
    expect(hint('ledger')).toBe('1 người mừng');
    expect(hint('thanks')).toBe('Đã cảm ơn 1');
    expect(hint('desk')).toBe('');
    expect(taskHint({ link: 'guests' }, {})).toBe('Chưa có khách');
  });
});
