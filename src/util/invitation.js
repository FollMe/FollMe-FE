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
  get: (guestId) => request.get(`api/invitations/${guestId}`),
  getPublic: (eventId) => request.get(`api/events/${eventId}/public`),
  rsvp: (guestId, payload) => request.put(`api/invitations/${guestId}/rsvp`, payload),
  rsvpPublic: (eventId, payload) => request.post(`api/events/${eventId}/public/rsvp`, payload),
  wish: (guestId, payload) => request.post(`api/invitations/${guestId}/wishes`, payload),
  wishPublic: (eventId, payload) => request.post(`api/events/${eventId}/public/wishes`, payload),
  create: (payload) => request.post('api/events', payload),
  update: (eventId, payload) => request.put(`api/events/${eventId}`, payload),
  hostGet: (eventId) => request.get(`api/events/${eventId}`),
  hideWish: (eventId, wishId) => request.put(`api/events/${eventId}/wishes/${wishId}/hide`),
  unhideWish: (eventId, wishId) => request.del(`api/events/${eventId}/wishes/${wishId}/hide`),
};

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

export function publicInvitationUrl(eventId) {
  return `${window.location.origin}/e/${eventId}`;
}

export function personalInvitationUrl(guestId) {
  return `${window.location.origin}/invitations/${guestId}`;
}
