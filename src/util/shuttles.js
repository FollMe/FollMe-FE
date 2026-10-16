// Buses the hosts lay on for guests (xe đưa đón), e.g. from the city to a
// wedding in the countryside: "Xe từ TP.HCM", leaving at 06:00 (Vietnam
// time) from "Ngã tư Hàng Xanh", 45 seats. Guests pick one when they say
// they are coming; everyone coming with them takes a seat.
import { isProgramTime } from './program';

export const MAX_SHUTTLES = 6;
export const MAX_SHUTTLE_LABEL = 60;
export const MAX_SHUTTLE_FROM = 120;
export const MAX_SHUTTLE_SEATS = 60;
// Coach sizes hired for weddings
export const BUS_SIZES = [16, 29, 45];

const sameBus = (shuttle, id) => Boolean(id) && String(shuttle._id) === String(id);

/** Seats a guest can take on a bus: the free ones, plus their own if they are on it. */
export function seatsLeft(shuttle, guest) {
  const rsvp = guest?.rsvp;
  const mine = rsvp?.status === 'attending' && sameBus(shuttle, rsvp.shuttle) ? rsvp.count || 1 : 0;
  return Math.max((shuttle.seats ?? 0) - (shuttle.taken ?? 0) + mine, 0);
}

/** "06:00 · Ngã tư Hàng Xanh" */
export function shuttleWhen(shuttle) {
  return [shuttle.time, shuttle.from].filter(Boolean).join(' · ');
}

/** "Xe từ TP.HCM, 06:00 tại Ngã tư Hàng Xanh" for messages ('from' in English), or ''. */
export function shuttleText(shuttle, lang = 'vi') {
  if (!shuttle) {
    return '';
  }
  const from = shuttle.from ? `${lang === 'en' ? ' from' : ' tại'} ${shuttle.from}` : '';
  return `${shuttle.label}, ${shuttle.time}${from}`;
}

/** The bus a guest coming is on, while it still runs. */
export function guestShuttle(event, guest) {
  const rsvp = guest?.rsvp;
  if (rsvp?.status !== 'attending' || !rsvp.shuttle) {
    return null;
  }
  return (event?.shuttles ?? []).find(s => sameBus(s, rsvp.shuttle)) ?? null;
}

/** Each bus with who is on it, in list order, and the seats they take. */
export function shuttleRiders(event, guests = []) {
  return (event?.shuttles ?? []).map(shuttle => {
    const riders = guests
      .filter(g => guestShuttle(event, g) === shuttle)
      .map(g => ({ id: g._id, name: g.name, people: g.rsvp.count || 1, group: g.group, arrived: Boolean(g.arrivedAt) }));
    return { ...shuttle, riders, taken: riders.reduce((n, r) => n + r.people, 0) };
  });
}

let nextId = 0;
/** Form rows from the event's buses; each keeps its _id (guests stay on it) and a React id. */
export function toShuttleRows(shuttles = []) {
  return shuttles.map(s => ({
    _id: s._id, label: s.label ?? '', time: s.time ?? '', from: s.from ?? '', seats: String(s.seats ?? ''), id: `s${nextId++}`,
  }));
}

/** A new, empty bus row. */
export function newShuttleRow(seats = BUS_SIZES[1]) {
  return { label: '', time: '', from: '', seats: String(seats), id: `s${nextId++}` };
}

const isSeats = value => /^\d+$/.test(String(value).trim()) && Number(value) >= 1 && Number(value) <= MAX_SHUTTLE_SEATS;

/** A named bus needs a time and 1 to 60 seats; rows without a name are left out. */
export function shuttleRowError(row) {
  return Boolean(row.label.trim()) && (!isProgramTime(row.time) || !isSeats(row.seats));
}

/** What is saved: named rows, one line each. */
export function tidyShuttleRows(rows = []) {
  const line = value => (value ?? '').replace(/\s+/g, ' ').trim();
  return rows
    .filter(row => line(row.label))
    .map(row => ({
      ...(row._id ? { _id: row._id } : {}),
      label: line(row.label),
      time: row.time,
      from: line(row.from),
      seats: Number(row.seats),
    }));
}
