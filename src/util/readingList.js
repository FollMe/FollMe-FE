// "Đọc sau" bookmarks and recently read posts, kept in this browser only so
// they work without an account.

const BOOKMARKS_KEY = 'follme.bookmarks';
const HISTORY_KEY = 'follme.history';
const MAX_HISTORY = 12;
const EVENT = 'follme:reading-list';

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (err) {
    return [];
  }
}

function write(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    // Storage full or blocked: the list just isn't saved.
  }
}

/**
 * @typedef {{ key: string, type: 'blog'|'story', title: string, to: string,
 *   image?: string, subtitle?: string, at: number }} ReadingItem
 * `key` identifies the post (e.g. "blog:slug"); for a series, `to` and
 * `subtitle` point at the last chapter read.
 */

export function getBookmarks() {
  return read(BOOKMARKS_KEY);
}

export function isBookmarked(key) {
  return getBookmarks().some(item => item.key === key);
}

/** Adds or removes a bookmark. Returns whether it is now bookmarked. */
export function toggleBookmark(item) {
  const items = getBookmarks();
  if (items.some(i => i.key === item.key)) {
    write(BOOKMARKS_KEY, items.filter(i => i.key !== item.key));
    return false;
  }
  write(BOOKMARKS_KEY, [{ ...item, at: Date.now() }, ...items]);
  return true;
}

export function removeBookmark(key) {
  write(BOOKMARKS_KEY, getBookmarks().filter(i => i.key !== key));
}

export function getHistory() {
  return read(HISTORY_KEY);
}

/** Records a read, newest first, one entry per post. */
export function recordRead(item) {
  const rest = getHistory().filter(i => i.key !== item.key);
  write(HISTORY_KEY, [{ ...item, at: Date.now() }, ...rest].slice(0, MAX_HISTORY));
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}

/** Calls `listener` whenever the lists change (in this tab or another). */
export function subscribeReadingList(listener) {
  const onStorage = (event) => {
    if (!event.key || event.key === BOOKMARKS_KEY || event.key === HISTORY_KEY) {
      listener();
    }
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
