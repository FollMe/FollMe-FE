// What happened on an event since the host last looked: answers and wishes
// that came in meanwhile. The last visit is remembered on this device.

const seenKey = eventId => `follme.seen.${eventId}`;

export function loadSeen(eventId) {
  try {
    return localStorage.getItem(seenKey(eventId));
  } catch (err) {
    return null;
  }
}

export function saveSeen(eventId, at = new Date().toISOString()) {
  try {
    localStorage.setItem(seenKey(eventId), at);
  } catch (err) {
    // Not remembered: nothing is shown as new next time
  }
}

const after = (date, since) => Boolean(date) && new Date(date) > new Date(since);

/** True when the guest answered after `since`. */
export function isNewAnswer(guest, since) {
  return Boolean(since) && after(guest.rsvp?.respondedAt, since);
}

/** Answers (newest first) and wishes that came in after `since`; nothing without one. */
export function whatsNew(event, since) {
  if (!since) {
    return { answers: [], wishes: [] };
  }
  const answers = (event.guests ?? [])
    .filter(g => isNewAnswer(g, since))
    .sort((a, b) => new Date(b.rsvp.respondedAt) - new Date(a.rsvp.respondedAt));
  const wishes = (event.wishes ?? []).filter(w => after(w.createdAt, since));
  return { answers, wishes };
}

/** "3 khách trả lời (2 sẽ đến, 1 không đến) · 1 lời chúc mới", or '' when nothing is new. */
export function newsText({ answers, wishes }) {
  const parts = [];
  if (answers.length) {
    const by = status => answers.filter(g => g.rsvp.status === status).length;
    const detail = [
      by('attending') && `${by('attending')} sẽ đến`,
      by('maybe') && `${by('maybe')} chưa chắc`,
      by('declined') && `${by('declined')} không đến`,
    ].filter(Boolean).join(', ');
    parts.push(`${answers.length} khách trả lời (${detail})`);
  }
  if (wishes.length) {
    parts.push(`${wishes.length} lời chúc mới`);
  }
  return parts.join(' · ');
}

/** "5 phút trước", "3 giờ trước", "2 ngày trước". */
export function ago(date, now = Date.now()) {
  const minutes = Math.max(1, Math.round((now - new Date(date).getTime()) / 60000));
  if (minutes < 60) {
    return `${minutes} phút trước`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ trước`;
  }
  return `${Math.round(hours / 24)} ngày trước`;
}
