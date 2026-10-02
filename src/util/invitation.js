import { request } from './request';

export const EVENT_TYPES = [
  { value: 'wedding', label: 'Đám cưới', emoji: '💍' },
  { value: 'engagement', label: 'Ăn hỏi', emoji: '🧧' },
  { value: 'birthday', label: 'Sinh nhật', emoji: '🎂' },
  { value: 'party', label: 'Tiệc', emoji: '🥂' },
  { value: 'other', label: 'Sự kiện khác', emoji: '📅' },
];

export const THEMES = [
  { value: 'blush', label: 'Hồng phấn', hint: 'Nhẹ nhàng, lãng mạn' },
  { value: 'classic', label: 'Đỏ son', hint: 'Truyền thống, trang trọng' },
  { value: 'minimal', label: 'Tối giản', hint: 'Trắng, thanh lịch' },
  { value: 'night', label: 'Đêm sao', hint: 'Xanh đêm, ánh vàng' },
];

export const DEFAULT_MESSAGES = {
  wedding: 'Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng mình. Rất mong được gặp bạn trong ngày vui này!',
  engagement: 'Trân trọng kính mời bạn tới chung vui cùng gia đình trong lễ ăn hỏi của chúng mình.',
  birthday: 'Một tuổi mới, một bữa tiệc nhỏ. Đến chung vui với mình nhé!',
  party: 'Có đồ ăn ngon, có nhạc hay, chỉ thiếu bạn thôi. Ghé chơi nhé!',
  other: '',
};

export const RSVP_LABELS = {
  attending: 'Sẽ tham dự',
  maybe: 'Chưa chắc',
  declined: 'Không thể đến',
};

export function isCoupleEvent(type) {
  return type === 'wedding' || type === 'engagement';
}

/** "Minh & Lan", or the event title when there is no couple. */
export function eventHeadline(event) {
  if (isCoupleEvent(event.type) && event.groomName && event.brideName) {
    return `${event.groomName} & ${event.brideName}`;
  }
  return event.title;
}

export function suggestTitle(type, groomName, brideName) {
  const couple = groomName && brideName ? ` ${groomName} & ${brideName}` : '';
  if (type === 'wedding') {
    return `Lễ thành hôn${couple}`;
  }
  if (type === 'engagement') {
    return `Lễ ăn hỏi${couple}`;
  }
  return '';
}

export const invitationApi = {
  get: (guestId, opts) => request.get(`api/invitations/${guestId}`, opts),
  getPublic: (eventId, opts) => request.get(`api/events/${eventId}/public`, opts),
  rsvp: (guestId, payload) => request.put(`api/invitations/${guestId}/rsvp`, payload),
  rsvpPublic: (eventId, payload) => request.post(`api/events/${eventId}/public/rsvp`, payload),
  wish: (guestId, payload) => request.post(`api/invitations/${guestId}/wishes`, payload),
  wishPublic: (eventId, payload) => request.post(`api/events/${eventId}/public/wishes`, payload),
  create: (payload) => request.post('api/events', payload),
  update: (eventId, payload) => request.put(`api/events/${eventId}`, payload),
  hostGet: (eventId) => request.get(`api/events/${eventId}`),
  hideWish: (eventId, wishId) => request.put(`api/events/${eventId}/wishes/${wishId}/hide`),
  unhideWish: (eventId, wishId) => request.del(`api/events/${eventId}/wishes/${wishId}/hide`),
  updateGuest: (eventId, guestId, payload) => request.put(`api/events/${eventId}/guests/${guestId}`, payload),
  removeGuest: (eventId, guestId) => request.del(`api/events/${eventId}/guests/${guestId}`),
  addPhoto: (eventId, blob) => {
    const form = new FormData();
    form.append('photo', blob, 'photo.jpg');
    return request.post(`api/events/${eventId}/photos`, form, true);
  },
  removePhoto: (eventId, photoId) => request.del(`api/events/${eventId}/photos/${photoId}`),
  orderPhotos: (eventId, order) => request.put(`api/events/${eventId}/photos/order`, { order }),
  screenKey: (eventId, rotate = false) => request.post(`api/events/${eventId}/screen-key`, { rotate }),
  screen: (eventId, key, since) => request.get(
    `api/events/${eventId}/screen/${key}${since ? `?since=${encodeURIComponent(since)}` : ''}`,
    { quiet: Boolean(since) },
  ),
};

export const MAX_PHOTOS = 12;

/** The link itself is wrong or gone (not a passing server or network error). */
export function isGoneError(err) {
  return err?.name === 'SERVER_ERROR' && (err.status === 404 || err.status === 400);
}

/** Who answered what and how many are coming (live, as the host edits). */
export function summarizeGuests(guests) {
  const summary = { invited: guests.length, sent: 0, opened: 0, attending: 0, maybe: 0, declined: 0, pending: 0, headcount: 0 };
  for (const guest of guests) {
    if (guest.sentAt) {
      summary.sent += 1;
    }
    if (guest.viewed > 0) {
      summary.opened += 1;
    }
    const status = guest.rsvp?.status;
    if (status in RSVP_LABELS) {
      summary[status] += 1;
    } else {
      summary.pending += 1;
    }
    if (status === 'attending') {
      summary.headcount += guest.rsvp.count || 1;
    }
  }
  return summary;
}

// Someone who answered on a public link gets a guest id; remember it so
// they can change their answer from the same browser.
const publicGuestKey = (eventId) => `follme.guest.${eventId}`;

export function getPublicGuest(eventId) {
  try {
    return JSON.parse(localStorage.getItem(publicGuestKey(eventId)));
  } catch (err) {
    return null;
  }
}

export function savePublicGuest(eventId, guest) {
  try {
    localStorage.setItem(publicGuestKey(eventId), JSON.stringify(guest));
  } catch (err) {
    // Not remembered; they can still answer again.
  }
}

// An envelope opened once is not shown again on this device: a guest
// coming back for the address or to change their answer goes straight in.
const openedKey = key => `follme.opened.${key}`;

export function wasOpened(key) {
  try {
    return Boolean(key) && localStorage.getItem(openedKey(key)) === '1';
  } catch (err) {
    return false;
  }
}

export function rememberOpened(key) {
  try {
    if (key) {
      localStorage.setItem(openedKey(key), '1');
    }
  } catch (err) {
    // Shown again next time
  }
}

export function publicInvitationUrl(eventId) {
  return `${window.location.origin}/e/${eventId}`;
}

/** Where guests at the party land from the QR on the venue screen. */
export function wishesUrl(eventId) {
  return `${window.location.origin}/e/${eventId}#loi-chuc`;
}

export function screenUrl(eventId, key) {
  return `${window.location.origin}/man-hinh/${eventId}/${key}`;
}

export function personalInvitationUrl(guestId) {
  return `${window.location.origin}/invitations/${guestId}`;
}
