import dayjs from 'dayjs';
import { vnWallClock } from './date';
import { eventHeadline, isCoupleEvent } from './invitation';

export const NAME_TOKEN = '{tên}';
export const LINK_TOKEN = '{link}';

const WEEKDAYS = ['Chủ Nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];

/** "11:00 thứ Bảy, 16/01/2027" in Vietnam time, where the event is. */
export function inviteWhen(startAt) {
  const at = vnWallClock(startAt);
  return `${dayjs(at).format('HH:mm')} ${WEEKDAYS[at.getDay()]}, ${dayjs(at).format('DD/MM/YYYY')}`;
}

/** The message sent with each personal link, before names are filled in. */
export function defaultTemplate(event) {
  const headline = eventHeadline(event);
  const what = {
    wedding: `lễ thành hôn của ${headline}`,
    engagement: `lễ ăn hỏi của ${headline}`,
  }[event.type] ?? headline;
  return `Trân trọng kính mời ${NAME_TOKEN} tới dự ${what} vào ${inviteWhen(event.startAt)}.\n`
    + `Thiệp mời dành riêng cho ${NAME_TOKEN}: ${LINK_TOKEN}`;
}

/** The nudge for guests who got their link but have not answered yet. */
export function defaultReminder(event) {
  const when = inviteWhen(event.startAt);
  const what = { wedding: 'lễ thành hôn', engagement: 'lễ ăn hỏi' }[event.type];
  const first = isCoupleEvent(event.type) && event.groomName && event.brideName
    ? `${eventHeadline(event)} rất mong được đón ${NAME_TOKEN} tới dự ${what} vào ${when}.`
    : `Rất mong được đón ${NAME_TOKEN} tới dự ${event.title} vào ${when}.`;
  return `${first}\nMong ${NAME_TOKEN} xác nhận tham dự trên thiệp mời để việc đón tiếp được chu đáo hơn: ${LINK_TOKEN}`;
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

/** The template for one guest. A template without {link} gets it at the end. */
export function inviteMessage(template, name, url) {
  const text = template.split(NAME_TOKEN).join(name);
  return text.includes(LINK_TOKEN) ? text.split(LINK_TOKEN).join(url) : `${text.trimEnd()}\n${url}`;
}

// `kind` is 'invite' (the invitation), 'remind' (the nudge to answer) or
// 'thank' (the thank-you after the party)
const storageKey = (eventId, kind) => `follme.${{ remind: 'remind', thank: 'thank' }[kind] ?? 'invite'}Template.${eventId}`;

export function loadTemplate(eventId, kind = 'invite') {
  try {
    return localStorage.getItem(storageKey(eventId, kind));
  } catch (err) {
    return null;
  }
}

export function saveTemplate(eventId, template, kind = 'invite') {
  try {
    if (template) {
      localStorage.setItem(storageKey(eventId, kind), template);
    } else {
      localStorage.removeItem(storageKey(eventId, kind));
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
