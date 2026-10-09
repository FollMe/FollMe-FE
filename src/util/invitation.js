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
  remove: (eventId) => request.del(`api/events/${eventId}`),
  hostGet: (eventId) => request.get(`api/events/${eventId}`),
  hideWish: (eventId, wishId) => request.put(`api/events/${eventId}/wishes/${wishId}/hide`),
  unhideWish: (eventId, wishId) => request.del(`api/events/${eventId}/wishes/${wishId}/hide`),
  updateGuest: (eventId, guestId, payload) => request.put(`api/events/${eventId}/guests/${guestId}`, payload),
  removeGuest: (eventId, guestId) => request.del(`api/events/${eventId}/guests/${guestId}`),
  addGiftGiver: (eventId, payload) => request.post(`api/events/${eventId}/gift-givers`, payload),
  seatGuests: (eventId, seats) => request.put(`api/events/${eventId}/tables`, { seats }),
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
  deskKey: (eventId, rotate = false) => request.post(`api/events/${eventId}/desk-key`, { rotate }),
  // The desk page says itself when its link is wrong or offline
  desk: (eventId, key, poll = false) => request.get(`api/events/${eventId}/desk/${key}${poll ? '?poll=1' : ''}`, { quiet: true }),
  // The desk keeps check-ins made offline and sends them later: it says itself what failed
  setArrival: (eventId, key, guestId, payload) => request.put(`api/events/${eventId}/desk/${key}/guests/${guestId}`, payload, { quiet: true }),
  addWalkIn: (eventId, key, payload) => request.post(`api/events/${eventId}/desk/${key}/guests`, payload),
  removeWalkIn: (eventId, key, guestId) => request.del(`api/events/${eventId}/desk/${key}/guests/${guestId}`),
};

export const MAX_PHOTOS = 12;

/**
 * Invited by the host with a personal link to send. Not someone who
 * answered on the public link, a walk-in added at the reception desk, or a
 * giver added to the gift ledger.
 */
export function hasPersonalLink(guest) {
  return !guest.source || guest.source === 'host';
}

/** Got their personal link but has not answered yet. */
export function awaitsAnswer(guest) {
  return hasPersonalLink(guest) && Boolean(guest.sentAt) && !guest.rsvp;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const dayOld = (date, now) => now - new Date(date).getTime() >= DAY_MS;

/**
 * Who to nudge: guests who got their link a day ago or more and have not
 * answered, unless reminded in the last day. Never reminded ones first.
 */
export function reminderQueue(guests, now = Date.now()) {
  const due = guests.filter(g => awaitsAnswer(g) && dayOld(g.sentAt, now) && (!g.remindedAt || dayOld(g.remindedAt, now)));
  return [...due.filter(g => !g.remindedAt), ...due.filter(g => g.remindedAt)];
}

/**
 * Who to thank after the party: guests with a personal link who came,
 * said they would, or sent a gift, and were not thanked yet.
 */
export function thankQueue(guests) {
  return guests.filter(g => hasPersonalLink(g) && !g.thankedAt
    && (g.arrivedAt || g.gift || g.rsvp?.status === 'attending'));
}

/** The link itself is wrong or gone (not a passing server or network error). */
export function isGoneError(err) {
  return err?.name === 'SERVER_ERROR' && (err.status === 404 || err.status === 400);
}

/** Who answered what, how many are coming and how many came (live, as the host edits). */
export function summarizeGuests(guests) {
  const summary = {
    invited: guests.length, sent: 0, opened: 0, attending: 0, maybe: 0, declined: 0, pending: 0, headcount: 0,
    arrived: 0, arrivedPeople: 0, gifts: 0, giftTotal: 0,
  };
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
    } else if (hasPersonalLink(guest)) {
      // Walk-ins and gift givers added later were never asked
      summary.pending += 1;
    }
    if (status === 'attending') {
      summary.headcount += guest.rsvp.count || 1;
    }
    if (guest.arrivedAt) {
      summary.arrived += 1;
      summary.arrivedPeople += guest.arrivedCount || 1;
    }
    if (guest.gift) {
      summary.gifts += 1;
      summary.giftTotal += guest.gift.amount || 0;
    }
  }
  return summary;
}

/**
 * The summary per group ("Nhà trai", "Nhà gái"...), for planning tables:
 * groups in the order they were first used, guests without one last.
 */
export function groupSummary(guests) {
  const groups = new Map();
  for (const guest of guests) {
    const group = guest.group || '';
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(guest);
  }
  return [...groups]
    .map(([group, list]) => ({ group, ...summarizeGuests(list) }))
    .sort((a, b) => (a.group === '') - (b.group === ''));
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

/** The reception desk page, for whoever welcomes guests at the party. */
export function deskUrl(eventId, key) {
  return `${window.location.origin}/don-khach/${eventId}/${key}`;
}

export function personalInvitationUrl(guestId) {
  return `${window.location.origin}/invitations/${guestId}`;
}
