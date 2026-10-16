// "Bạn muốn nghe bài gì?": songs guests asked for with their answer, for the
// band or DJ. The same song typed differently counts once.

export const MAX_SONG = 100;

const fold = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * [{ song, guests: [names] }], most asked first, then by title. Only guests
 * still coming; the first spelling seen is the one shown.
 */
export function songRequests(guests = []) {
  const songs = new Map();
  for (const guest of guests) {
    const song = guest.rsvp?.song?.trim();
    if (!song || guest.rsvp.status === 'declined') {
      continue;
    }
    const key = fold(song);
    if (!key) {
      continue;
    }
    const entry = songs.get(key) ?? { song, guests: [] };
    entry.guests.push(guest.name);
    songs.set(key, entry);
  }
  return [...songs.values()].sort((a, b) => b.guests.length - a.guests.length || a.song.localeCompare(b.song, 'vi'));
}

/** The list to paste to the band: "1. Ngày đầu tiên – Đức Phúc (3 khách)". */
export function songListText(requests, title = '') {
  const lines = requests.map((r, i) => `${i + 1}. ${r.song}${r.guests.length > 1 ? ` (${r.guests.length} khách)` : ''}`);
  return [title && `Bài hát khách muốn nghe · ${title}`, ...lines].filter(Boolean).join('\n');
}
