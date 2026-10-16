// The program of the day ("17:00 Đón khách", "18:00 Khai tiệc"): times are
// read in Vietnam, on the day of the event.
import { fromVnWallClock, vnWallClock } from './date';

export const MAX_PROGRAM_ITEMS = 8;
export const MAX_PROGRAM_LABEL = 60;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// The last moment stays "now" this long, then the day is over
const LAST_ITEM_MS = 2 * 60 * 60 * 1000;

/** Moments hosts often add, offered as one-tap chips. */
export const PROGRAM_LABELS = {
  wedding: ['Đón khách', 'Lễ gia tiên', 'Làm lễ thành hôn', 'Khai tiệc', 'Cắt bánh, rót rượu', 'Giao lưu văn nghệ', 'Tiễn khách'],
  engagement: ['Nhà trai tới', 'Lễ ăn hỏi', 'Trao lễ vật', 'Tiệc thân mật', 'Tiễn khách'],
  birthday: ['Đón khách', 'Thổi nến, cắt bánh', 'Khai tiệc', 'Văn nghệ, trò chơi'],
  party: ['Đón khách', 'Khai tiệc', 'Văn nghệ, trò chơi', 'Bốc thăm trúng thưởng'],
  other: ['Đón khách', 'Bắt đầu', 'Giải lao', 'Kết thúc'],
};

// [minutes after the start, label]
const SUGGESTED = {
  wedding: [[0, 'Đón khách'], [30, 'Làm lễ thành hôn'], [60, 'Khai tiệc']],
  engagement: [[0, 'Nhà trai tới'], [30, 'Lễ ăn hỏi'], [90, 'Tiệc thân mật']],
  birthday: [[0, 'Đón khách'], [30, 'Thổi nến, cắt bánh'], [45, 'Khai tiệc']],
  party: [[0, 'Đón khách'], [30, 'Khai tiệc']],
  other: [[0, 'Đón khách'], [30, 'Bắt đầu']],
};

export const isProgramTime = time => TIME_RE.test(time ?? '');

/** "HH:mm" `minutes` after `time`, or null past midnight. */
export function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  if (total >= 24 * 60) {
    return null;
  }
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** A first program from the start time ("HH:mm" in Vietnam) and the kind of event. */
export function suggestProgram(type, startTime) {
  return (SUGGESTED[type] ?? SUGGESTED.other)
    .map(([after, label]) => ({ time: addMinutes(startTime, after), label }))
    .filter(item => item.time);
}

/** What is sent and shown: labels on one line, empty ones left out, in time order. */
export function tidyProgram(items = []) {
  return items
    .map(item => ({ time: item.time, label: (item.label ?? '').replace(/\s+/g, ' ').trim() }))
    .filter(item => item.label)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** The real moment (ms) of `time` on the event's day. */
export function programMoment(time, startAt) {
  const day = vnWallClock(startAt);
  const [h, m] = time.split(':').map(Number);
  return fromVnWallClock(new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m)).getTime();
}

/**
 * Where the day stands at `now`: the index of the moment under way (-1
 * before the first one and once the day is over) and of the next one (-1
 * when nothing is left).
 */
export function programState(program = [], startAt, now = Date.now()) {
  const moments = program.map(item => programMoment(item.time, startAt));
  let current = -1;
  moments.forEach((at, i) => {
    if (at <= now) {
      current = i;
    }
  });
  const next = moments.findIndex(at => at > now);
  if (current === moments.length - 1 && current >= 0 && now - moments[current] >= LAST_ITEM_MS) {
    current = -1;
  }
  return { current, next, isOver: next === -1 && current === -1 && moments.length > 0 };
}

/** "Đón khách 17:00 · Khai tiệc 18:00", for messages and calendars. */
export function programText(program = []) {
  return program.map(item => `${item.label} ${item.time}`).join(' · ');
}
