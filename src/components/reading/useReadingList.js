import { useEffect, useState } from 'react';
import { getBookmarks, getHistory, subscribeReadingList } from 'util/readingList';

/** Live bookmarks and history from this browser. */
export default function useReadingList() {
  const [lists, setLists] = useState(() => ({ bookmarks: getBookmarks(), history: getHistory() }));
  useEffect(() => subscribeReadingList(() => setLists({ bookmarks: getBookmarks(), history: getHistory() })), []);
  return lists;
}
