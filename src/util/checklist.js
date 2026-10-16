// The checklist (việc cần làm): what to do before and after the day, each
// task with a due date counted from the event, many leading to the tool
// that does it. Days are counted in Vietnam, where the event is.
import dayjs from 'dayjs';
import { vnWallClock } from './date';
import { daysToAnswer } from './inviteMessage';
import { hasPersonalLink, summarizeGuests } from './invitation';
import { seatingPlan } from './seating';

export const MAX_TASKS = 60;
export const MAX_TASK_LABEL = 80;

/** Where a task's shortcut leads. */
export const TASK_LINKS = {
  date: { label: 'Xem ngày cưới', to: () => '/cuoi-hoi/chon-ngay' },
  budget: { label: 'Thu chi', to: id => `/events/${id}/thu-chi` },
  guests: { label: 'Khách mời', to: id => `/events/${id}#khach-moi` },
  send: { label: 'Gửi thiệp', to: id => `/events/${id}#khach-moi` },
  remind: { label: 'Nhắc khách', to: id => `/events/${id}#khach-moi` },
  program: { label: 'Sửa thiệp', to: id => `/events/${id}/edit` },
  photos: { label: 'Thêm ảnh', to: id => `/events/${id}/edit` },
  seating: { label: 'Xếp bàn', to: id => `/events/${id}/xep-ban` },
  desk: { label: 'Link đón khách', to: id => `/events/${id}#don-khach` },
  screen: { label: 'Màn hình', to: id => `/events/${id}#man-hinh` },
  ledger: { label: 'Sổ mừng', to: id => `/events/${id}/so-mung` },
  thanks: { label: 'Cảm ơn khách', to: id => `/events/${id}#khach-moi` },
  guestbook: { label: 'In sổ', to: id => `/events/${id}/loi-chuc/in` },
};

// [days from the event (negative: before), label, link]
const STARTERS = {
  wedding: [
    [-180, 'Lên ngân sách đám cưới', 'budget'],
    [-150, 'Đặt nhà hàng tiệc cưới', 'budget'],
    [-120, 'Chụp ảnh cưới', 'photos'],
    [-90, 'Chọn váy cưới, vest', 'budget'],
    [-90, 'Đặt nhẫn cưới', 'budget'],
    [-60, 'Lên danh sách khách mời', 'guests'],
    [-60, 'Đặt MC, ban nhạc, trang trí', 'budget'],
    [-45, 'Thêm chương trình tiệc vào thiệp', 'program'],
    [-30, 'Gửi thiệp mời', 'send'],
    [-30, 'Chuẩn bị mâm quả, sính lễ', null],
    [-14, 'Nhắc khách chưa trả lời', 'remind'],
    [-10, 'Chốt số bàn với nhà hàng', 'seating'],
    [-7, 'Xếp bàn cho khách', 'seating'],
    [-3, 'Gửi link đón khách cho người tiếp tân', 'desk'],
    [-1, 'Thử màn hình lời chúc ở hội trường', 'screen'],
    [1, 'Ghi sổ mừng', 'ledger'],
    [3, 'Gửi lời cảm ơn khách', 'thanks'],
    [7, 'In sổ lưu bút làm kỷ niệm', 'guestbook'],
    [14, 'Trả nốt các khoản chi', 'budget'],
  ],
  engagement: [
    [-45, 'Đặt mâm quả', 'budget'],
    [-30, 'Lên danh sách khách mời', 'guests'],
    [-21, 'Gửi thiệp mời', 'send'],
    [-7, 'Nhắc khách chưa trả lời', 'remind'],
    [-3, 'Chốt số mâm, số bàn', 'seating'],
    [1, 'Ghi sổ mừng', 'ledger'],
    [3, 'Gửi lời cảm ơn khách', 'thanks'],
  ],
  other: [
    [-30, 'Lên danh sách khách mời', 'guests'],
    [-21, 'Gửi thiệp mời', 'send'],
    [-7, 'Nhắc khách chưa trả lời', 'remind'],
    [-3, 'Chốt số người với nơi tổ chức', 'seating'],
    [2, 'Gửi lời cảm ơn khách', 'thanks'],
  ],
};

/** Noon in Vietnam, `days` after the event's day: a due date safe from time zones. */
export function eventDay(startAt, days = 0) {
  const at = vnWallClock(startAt);
  return new Date(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate() + days, 5)).toISOString();
}

/**
 * The usual tasks of this kind of event, due counted from its day. Tasks
 * already late when the list is made are due today, still in their order.
 */
export function starterTasks(type, startAt, now = Date.now()) {
  const today = eventDay(now);
  return (STARTERS[type] ?? STARTERS.other).map(([days, label, link]) => {
    const due = eventDay(startAt, days);
    return { label, due: due < today ? today : due, ...(link ? { link } : {}) };
  });
}

/** Days until `due` (0 today, negative when late), by the calendar in Vietnam. */
export const daysLeft = (due, now = Date.now()) => daysToAnswer(due, now);

/** "Hôm nay", "Ngày mai", "Trễ 2 ngày", "Còn 5 ngày · 20/11", "Hạn 15/03/2027". */
export function dueText(due, now = Date.now()) {
  if (!due) {
    return '';
  }
  const days = daysLeft(due, now);
  const day = vnWallClock(due);
  if (days < 0) {
    return `Trễ ${-days} ngày · ${dayjs(day).format('DD/MM')}`;
  }
  if (days === 0) {
    return 'Hôm nay';
  }
  if (days === 1) {
    return 'Ngày mai';
  }
  if (days <= 30) {
    return `Còn ${days} ngày · ${dayjs(day).format('DD/MM')}`;
  }
  return `Hạn ${dayjs(day).format('DD/MM/YYYY')}`;
}

const byDue = (a, b) => (a.due ? new Date(a.due).getTime() : Infinity) - (b.due ? new Date(b.due).getTime() : Infinity);

export const TASK_SECTIONS = [
  ['late', 'Trễ hạn'],
  ['week', '7 ngày tới'],
  ['month', 'Trong tháng'],
  ['later', 'Sau này'],
  ['done', 'Đã xong'],
];

/** Tasks per section, each in due order; done ones latest first. */
export function taskSections(tasks = [], now = Date.now()) {
  const sections = Object.fromEntries(TASK_SECTIONS.map(([key]) => [key, []]));
  for (const task of tasks) {
    if (task.done) {
      sections.done.push(task);
      continue;
    }
    const days = task.due ? daysLeft(task.due, now) : Infinity;
    const key = days < 0 ? 'late' : days <= 7 ? 'week' : days <= 30 ? 'month' : 'later';
    sections[key].push(task);
  }
  for (const key of ['late', 'week', 'month', 'later']) {
    sections[key].sort(byDue);
  }
  sections.done.sort((a, b) => new Date(b.doneAt ?? 0) - new Date(a.doneAt ?? 0));
  return sections;
}

/** The first task not done yet, by due date. */
export function nextTask(tasks = []) {
  return tasks.filter(t => !t.done).sort(byDue)[0] ?? null;
}

/** Where the tool behind a task stands, from the event itself: "Đã gửi 30/45". */
export function taskHint(task, event) {
  const guests = event.guests ?? [];
  const summary = summarizeGuests(guests);
  switch (task.link) {
    case 'guests':
      return guests.length ? `${guests.length} khách` : 'Chưa có khách';
    case 'send': {
      const invited = guests.filter(hasPersonalLink).length;
      return invited ? `Đã gửi ${summary.sent}/${invited}` : '';
    }
    case 'remind':
      return summary.pending ? `${summary.pending} khách chưa trả lời` : 'Ai cũng đã trả lời';
    case 'seating': {
      const plan = seatingPlan(guests, event.seatsPerTable);
      return plan.tables.length ? `${plan.tables.length} bàn${plan.waiting ? ` · ${plan.waiting} người chưa có bàn` : ''}` : '';
    }
    case 'program':
      return event.program?.length ? `${event.program.length} mục` : '';
    case 'photos':
      return event.photos?.length ? `${event.photos.length} ảnh` : '';
    case 'budget':
      return event.expenses?.length ? `${event.expenses.length} khoản chi` : '';
    case 'ledger':
      return summary.gifts ? `${summary.gifts} người mừng` : '';
    case 'thanks': {
      const thanked = guests.filter(g => g.thankedAt).length;
      return thanked ? `Đã cảm ơn ${thanked}` : '';
    }
    default:
      return '';
  }
}
