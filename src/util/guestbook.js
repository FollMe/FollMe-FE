// The guestbook (sổ lưu bút) on paper: every wish, in the order they came,
// to keep after the party.

/** Wishes to print, oldest first; hidden ones only when asked for. */
export function bookWishes(wishes = [], { includeHidden = false } = {}) {
  return wishes
    .filter(w => includeHidden || !w.isHidden)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/** The ink of the book, by the invitation's theme: darker than on screen, for paper. */
export const BOOK_ACCENTS = {
  blush: '#9d4a5d',
  classic: '#8f1c1a',
  minimal: '#27272a',
  night: '#7a5d1f',
};

/** "128 lời chúc từ những người thương" and the like. */
export function bookCount(count) {
  return count ? `${count} lời chúc từ những người thương` : 'Chưa có lời chúc nào';
}
