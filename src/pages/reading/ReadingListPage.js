import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { IoClose } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import ReadingRow from 'components/reading/ReadingRow';
import useReadingList from 'components/reading/useReadingList';
import { clearHistory, removeBookmark } from 'util/readingList';
import styles from 'components/reading/Reading.module.scss';

export default function ReadingListPage() {
  const { bookmarks, history } = useReadingList();
  const [tab, setTab] = useState(bookmarks.length > 0 || history.length === 0 ? 'saved' : 'recent');

  useEffect(() => {
    document.title = 'Đọc sau | FollMe';
  }, []);

  const items = tab === 'saved' ? bookmarks : history;

  return (
    <div className="container container--narrow page">
      <PageHeader
        eyebrow="Thư viện của bạn"
        title="Đọc sau"
        description="Bài viết và truyện bạn đã lưu hoặc vừa đọc. Danh sách nằm ngay trên trình duyệt này, không cần đăng nhập."
      />
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="saved" label={`Đã lưu (${bookmarks.length})`} />
        <Tab value="recent" label={`Đọc gần đây (${history.length})`} />
      </Tabs>

      {items.length === 0 ? (
        <div className="empty-state">
          {tab === 'saved'
            ? <>Chưa có gì ở đây. Bấm “Đọc sau” trên một <Link to="/blogs">bài viết</Link> hoặc <Link to="/stories">truyện</Link> để lưu lại.</>
            : 'Bạn chưa đọc bài nào trên trình duyệt này.'}
        </div>
      ) : (
        <div className={styles.list}>
          {items.map(item => (
            <ReadingRow
              key={item.key}
              item={item}
              action={tab === 'saved' && (
                <IconButton aria-label={`Bỏ lưu ${item.title}`} onClick={() => removeBookmark(item.key)}>
                  <IoClose />
                </IconButton>
              )}
            />
          ))}
        </div>
      )}

      {tab === 'recent' && history.length > 0 && (
        <Button sx={{ mt: 2 }} onClick={clearHistory}>Xóa lịch sử đọc</Button>
      )}
    </div>
  );
}
