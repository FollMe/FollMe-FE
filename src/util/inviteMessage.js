import dayjs from 'dayjs';
import { vnWallClock } from './date';
import { eventHeadline, isCoupleEvent } from './invitation';
import { programText } from './program';
import { tableLabel } from './seating';
import { cardText, shortDayEn } from './cardText';

export const NAME_TOKEN = '{tên}';
export const LINK_TOKEN = '{link}';
export const TABLE_TOKEN = '{bàn}';

const WEEKDAYS = ['Chủ Nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];

/** "11:00 thứ Bảy, 16/01/2027" in Vietnam time, where the event is. */
export function inviteWhen(startAt) {
  const at = vnWallClock(startAt);
  return `${dayjs(at).format('HH:mm')} ${WEEKDAYS[at.getDay()]}, ${dayjs(at).format('DD/MM/YYYY')}`;
}

/** "6:00 PM, Saturday 16 January 2027" in Vietnam time, for English messages. */
export function inviteWhenEn(startAt) {
  return dayjs(vnWallClock(startAt)).format('h:mm A, dddd D MMMM YYYY');
}

/** "thứ Bảy, 09/01": a day in Vietnam, for the answer-by date. */
export function shortDay(date) {
  const at = vnWallClock(date);
  return `${WEEKDAYS[at.getDay()]}, ${dayjs(at).format('DD/MM')}`;
}

/** Days left to answer by `rsvpBy` (0 = today, -1 = yesterday), by the calendar in Vietnam. */
export function daysToAnswer(rsvpBy, now = Date.now()) {
  const day = date => {
    const at = vnWallClock(date);
    return Date.UTC(at.getFullYear(), at.getMonth(), at.getDate());
  };
  return Math.round((day(rsvpBy) - day(now)) / 86400000);
}

/** Where the answer-by date stands, for the reminder bar. */
export function deadlineText(rsvpBy, now = Date.now()) {
  const days = daysToAnswer(rsvpBy, now);
  if (days < 0) {
    return `Đã qua hạn trả lời ${shortDay(rsvpBy)}`;
  }
  if (days <= 1) {
    return `Hạn trả lời là ${days === 0 ? 'hôm nay' : 'ngày mai'}`;
  }
  return `Hạn trả lời ${shortDay(rsvpBy)}, còn ${days} ngày`;
}

/** The answer-by date to mention, or null when there is none or it has passed. */
function openDeadline(event, now) {
  return event.rsvpBy && daysToAnswer(event.rsvpBy, now) >= 0 ? shortDay(event.rsvpBy) : null;
}

/** The message sent with each personal link, before names are filled in. */
export function defaultTemplate(event, now = Date.now()) {
  const headline = eventHeadline(event);
  const what = {
    wedding: `lễ thành hôn của ${headline}`,
    engagement: `lễ ăn hỏi của ${headline}`,
  }[event.type] ?? headline;
  const by = openDeadline(event, now);
  return `Trân trọng kính mời ${NAME_TOKEN} tới dự ${what} vào ${inviteWhen(event.startAt)}.\n`
    + (event.program?.length ? `${programText(event.program)}.\n` : '')
    + (by ? `Mong ${NAME_TOKEN} xác nhận tham dự trước ${by}.\n` : '')
    + `Thiệp mời dành riêng cho ${NAME_TOKEN}: ${LINK_TOKEN}`;
}

/** The nudge for guests who got their link but have not answered yet. */
export function defaultReminder(event, now = Date.now()) {
  const when = inviteWhen(event.startAt);
  const by = openDeadline(event, now);
  const what = { wedding: 'lễ thành hôn', engagement: 'lễ ăn hỏi' }[event.type];
  const first = isCoupleEvent(event.type) && event.groomName && event.brideName
    ? `${eventHeadline(event)} rất mong được đón ${NAME_TOKEN} tới dự ${what} vào ${when}.`
    : `Rất mong được đón ${NAME_TOKEN} tới dự ${event.title} vào ${when}.`;
  return `${first}\nMong ${NAME_TOKEN} xác nhận tham dự trên thiệp mời${by ? ` trước ${by}` : ''} để việc đón tiếp được chu đáo hơn: ${LINK_TOKEN}`;
}

/**
 * The thank-you after the party, for guests who came or sent a gift. Their
 * card then thanks them too, with the album and everyone's wishes.
 */
export function defaultThanks(event) {
  const what = { wedding: 'ngày cưới', engagement: 'lễ ăn hỏi' }[event.type];
  const first = isCoupleEvent(event.type) && event.groomName && event.brideName
    ? `${eventHeadline(event)} xin cảm ơn ${NAME_TOKEN} đã chung vui cùng chúng mình trong ${what}.`
    : `Cảm ơn ${NAME_TOKEN} đã chung vui cùng chúng mình tại ${event.title}.`;
  const keepsake = (event.photos ?? []).length > 0 ? 'Ảnh và lời chúc của mọi người' : 'Lời chúc của mọi người';
  return `${first}\n${keepsake} ở đây nhé: ${LINK_TOKEN}`;
}

/**
 * The message for the day, a day or two before, to guests who said yes:
 * when, where, their table (the {bàn} line goes for guests without one),
 * and their card for the way there.
 */
export function defaultDayOf(event) {
  const what = { wedding: 'lễ thành hôn', engagement: 'lễ ăn hỏi' }[event.type];
  const first = isCoupleEvent(event.type) && event.groomName && event.brideName
    ? `${eventHeadline(event)} hẹn gặp ${NAME_TOKEN} tại ${what} lúc ${inviteWhen(event.startAt)}, ở ${event.location}.`
    : `Hẹn gặp ${NAME_TOKEN} tại ${event.title} lúc ${inviteWhen(event.startAt)}, ở ${event.location}.`;
  return `${first}\n`
    + `Chỗ ngồi của ${NAME_TOKEN}: ${TABLE_TOKEN}.\n`
    + (event.program?.length ? `${programText(event.program)}.\n` : '')
    + `Chỉ đường và thiệp của ${NAME_TOKEN}: ${LINK_TOKEN}`;
}

// The same four messages in English, for guests whose card is in English
// (foreign friends, family abroad). Names, place and title stay as written.
const coupleOf = event => isCoupleEvent(event.type) && event.groomName && event.brideName;

/** The English answer-by date to mention, or null when there is none or it has passed. */
function openDeadlineEn(event, now) {
  return event.rsvpBy && daysToAnswer(event.rsvpBy, now) >= 0 ? shortDayEn(event.rsvpBy) : null;
}

export function defaultTemplateEn(event, now = Date.now()) {
  const headline = eventHeadline(event);
  const what = { wedding: `the wedding of ${headline}`, engagement: `the engagement ceremony of ${headline}` }[event.type] ?? headline;
  const by = openDeadlineEn(event, now);
  return `Dear ${NAME_TOKEN},\nYou are warmly invited to ${what} at ${inviteWhenEn(event.startAt)} (Vietnam time), ${event.location}.\n`
    + (by ? `Please let us know if you can come by ${by}.\n` : '')
    + `Your invitation: ${LINK_TOKEN}`;
}

export function defaultReminderEn(event, now = Date.now()) {
  const by = openDeadlineEn(event, now);
  const what = { wedding: 'wedding', engagement: 'engagement ceremony' }[event.type];
  const first = coupleOf(event)
    ? `${eventHeadline(event)} would love to see you, ${NAME_TOKEN}, at their ${what} at ${inviteWhenEn(event.startAt)} (Vietnam time).`
    : `We would love to see you, ${NAME_TOKEN}, at ${event.title} at ${inviteWhenEn(event.startAt)} (Vietnam time).`;
  return `${first}\nPlease answer on your invitation${by ? ` by ${by}` : ''} so we can prepare for you: ${LINK_TOKEN}`;
}

export function defaultThanksEn(event) {
  const what = { wedding: 'our wedding', engagement: 'our engagement' }[event.type];
  const first = coupleOf(event)
    ? `${eventHeadline(event)}: thank you, ${NAME_TOKEN}, for celebrating ${what} with us.`
    : `Thank you, ${NAME_TOKEN}, for joining us at ${event.title}.`;
  const keepsake = (event.photos ?? []).length > 0 ? "Photos and everyone's wishes" : "Everyone's wishes";
  return `${first}\n${keepsake} are here: ${LINK_TOKEN}`;
}

export function defaultDayOfEn(event) {
  const what = { wedding: 'the wedding', engagement: 'the engagement ceremony' }[event.type];
  const first = coupleOf(event)
    ? `${eventHeadline(event)} look forward to seeing you, ${NAME_TOKEN}, at ${what} at ${inviteWhenEn(event.startAt)} (Vietnam time), ${event.location}.`
    : `See you, ${NAME_TOKEN}, at ${event.title} at ${inviteWhenEn(event.startAt)} (Vietnam time), ${event.location}.`;
  return `${first}\n`
    + `Your seat: ${TABLE_TOKEN}.\n`
    + `Directions and your invitation: ${LINK_TOKEN}`;
}

/** The default message of a kind ('invite', 'remind', 'dayof', 'thank') in a language. */
export function defaultMessage(event, kind, lang = 'vi') {
  const make = lang === 'en'
    ? { invite: defaultTemplateEn, remind: defaultReminderEn, dayof: defaultDayOfEn, thank: defaultThanksEn }
    : { invite: defaultTemplate, remind: defaultReminder, dayof: defaultDayOf, thank: defaultThanks };
  return (make[kind] ?? make.invite)(event);
}

/** Whether a guest gets their messages and card in English. */
export function isEnglishGuest(guest) {
  return guest?.lang === 'en';
}

/**
 * The template for one guest. A template without {link} gets it at the end.
 * {bàn} is their table ("Table 5" in English); a line with it is left out when they have none.
 */
export function inviteMessage(template, name, url, { table, lang } = {}) {
  const withTable = template.split('\n')
    .filter(line => !line.includes(TABLE_TOKEN) || table)
    .join('\n')
    .split(TABLE_TOKEN).join(table ? (lang === 'en' ? cardText('en').table(table) : tableLabel(table)) : '');
  const text = withTable.split(NAME_TOKEN).join(name);
  return text.includes(LINK_TOKEN) ? text.split(LINK_TOKEN).join(url) : `${text.trimEnd()}\n${url}`;
}

// `kind` is 'invite' (the invitation), 'remind' (the nudge to answer),
// 'dayof' (the time, way and table, the day before) or 'thank' (after the party);
// English ones are kept apart
const storageKey = (eventId, kind, lang) => `follme.${{ remind: 'remind', dayof: 'dayof', thank: 'thank' }[kind] ?? 'invite'}Template${lang === 'en' ? 'En' : ''}.${eventId}`;

export function loadTemplate(eventId, kind = 'invite', lang = 'vi') {
  try {
    return localStorage.getItem(storageKey(eventId, kind, lang));
  } catch (err) {
    return null;
  }
}

export function saveTemplate(eventId, template, kind = 'invite', lang = 'vi') {
  try {
    if (template) {
      localStorage.setItem(storageKey(eventId, kind, lang), template);
    } else {
      localStorage.removeItem(storageKey(eventId, kind, lang));
    }
  } catch (err) {
    // Kept for this visit only
  }
}

/** Phones send through the share sheet (Zalo, Messenger...); computers copy. */
export function canShareText() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    && window.matchMedia?.('(pointer: coarse)').matches;
}

/**
 * Sends one invitation. Resolves to 'shared' or 'copied'; rejects when the
 * host closed the share sheet without sending.
 */
export async function sendInvite(text) {
  if (canShareText()) {
    await navigator.share({ text });
    return 'shared';
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
