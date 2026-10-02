import dayjs from 'dayjs';
import { vnWallClock } from './date';
import { eventHeadline } from './invitation';

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

/** The template for one guest. A template without {link} gets it at the end. */
export function inviteMessage(template, name, url) {
  const text = template.split(NAME_TOKEN).join(name);
  return text.includes(LINK_TOKEN) ? text.split(LINK_TOKEN).join(url) : `${text.trimEnd()}\n${url}`;
}

const storageKey = eventId => `follme.inviteTemplate.${eventId}`;

export function loadTemplate(eventId) {
  try {
    return localStorage.getItem(storageKey(eventId));
  } catch (err) {
    return null;
  }
}

export function saveTemplate(eventId, template) {
  try {
    if (template) {
      localStorage.setItem(storageKey(eventId), template);
    } else {
      localStorage.removeItem(storageKey(eventId));
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
