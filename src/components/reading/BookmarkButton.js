import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import { IoBookmark, IoBookmarkOutline } from 'react-icons/io5';
import { isBookmarked, subscribeReadingList, toggleBookmark } from 'util/readingList';

/**
 * "Đọc sau" toggle. `item` is a ReadingItem without `at`.
 */
export default function BookmarkButton({ item }) {
  const [saved, setSaved] = useState(() => isBookmarked(item.key));

  useEffect(() => {
    setSaved(isBookmarked(item.key));
    return subscribeReadingList(() => setSaved(isBookmarked(item.key)));
  }, [item.key]);

  function handleClick() {
    const now = toggleBookmark(item);
    setSaved(now);
    toast(now ? 'Đã lưu vào danh sách Đọc sau' : 'Đã bỏ khỏi Đọc sau', { autoClose: 1800 });
  }

  return (
    <Button
      variant={saved ? 'contained' : 'outlined'}
      size="small"
      onClick={handleClick}
      startIcon={saved ? <IoBookmark /> : <IoBookmarkOutline />}
      aria-pressed={saved}
    >
      {saved ? 'Đã lưu' : 'Đọc sau'}
    </Button>
  );
}
