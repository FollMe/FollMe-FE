import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Dialog from '@mui/material/Dialog';
import {
  IoSearchOutline, IoNewspaperOutline, IoLibraryOutline, IoHomeOutline, IoCreateOutline, IoTicketOutline,
  IoCalculatorOutline, IoGridOutline, IoCalendarOutline, IoBookmarksOutline, IoContrastOutline, IoReturnDownBack,
} from 'react-icons/io5';
import { useColorMode } from 'customHooks/useColorMode';
import { getStoryLink } from 'components/story/StoryItem';
import { request } from 'util/request';
import { normalizeText, searchItems } from 'util/search';
import styles from './CommandPalette.module.scss';

const PAGES = [
  { title: 'Trang chủ', to: '/', icon: <IoHomeOutline />, keywords: 'home' },
  { title: 'Blog', to: '/blogs', icon: <IoNewspaperOutline />, keywords: 'bai viet ky thuat' },
  { title: 'Viết blog mới', to: '/blogs/create', icon: <IoCreateOutline />, keywords: 'soan bai dang' },
  { title: 'Truyện', to: '/stories', icon: <IoLibraryOutline />, keywords: 'truyen dai ngan doc' },
  { title: 'Lịch vạn niên hôm nay', to: '/fortune/lich', icon: <IoCalendarOutline />, keywords: 'lich am ngay tot gio hoang dao tiet khi' },
  { title: 'Thần số học', to: '/fortune/numerology', icon: <IoCalculatorOutline />, keywords: 'numerology so chu dao' },
  { title: 'Lá số tử vi', to: '/fortune/tu-vi', icon: <IoGridOutline />, keywords: 'tu vi la so' },
  { title: 'Hồ sơ tử vi đã lưu', to: '/fortune/profiles', icon: <IoBookmarksOutline />, keywords: 'ho so luu' },
  { title: 'Thư mời điện tử', to: '/events', icon: <IoTicketOutline />, keywords: 'su kien thiep moi' },
];

// Blogs and stories are fetched once per page load, on first open.
let contentPromise = null;
function loadContent() {
  if (!contentPromise) {
    contentPromise = Promise.all([request.get('api/blogs'), request.get('api/stories')])
      .then(([blogRes, storyRes]) => ({
        blogs: Array.isArray(blogRes?.blogs) ? blogRes.blogs : [],
        stories: Array.isArray(storyRes?.stories) ? storyRes.stories : [],
      }))
      .catch(err => {
        contentPromise = null;
        throw err;
      });
  }
  return contentPromise;
}

function isTypingTarget(el) {
  return el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/**
 * Site-wide search (Ctrl/⌘ + K, or "/"): pages, blogs and stories, with
 * Vietnamese accent-insensitive matching and keyboard navigation.
 */
export default function CommandPalette({ open, onOpen, onClose }) {
  const navigate = useNavigate();
  const [, toggleMode] = useColorMode();
  const [query, setQuery] = useState('');
  const [content, setContent] = useState({ blogs: [], stories: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    function onKeyDown(event) {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      const isSlash = event.key === '/' && !isTypingTarget(document.activeElement);
      if (isShortcut || isSlash) {
        event.preventDefault();
        onOpen();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setActiveIndex(0);
    setIsLoading(true);
    loadContent()
      .then(setContent)
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false));
  }, [open]);

  const groups = useMemo(() => {
    const q = normalizeText(query);
    const actions = [
      { title: 'Đổi giao diện sáng / tối', icon: <IoContrastOutline />, keywords: 'theme dark light toi sang', run: toggleMode },
    ];
    const pages = [...PAGES, ...actions].map(p => ({ ...p, kind: 'page' }));
    const blogs = content.blogs.map(b => ({
      kind: 'blog',
      title: b.title,
      to: `/blogs/${b.slug}`,
      meta: b.author?.name ?? b.author?.slEmail,
      image: b.thumbnail?.link,
    }));
    const stories = content.stories.map(s => ({
      kind: 'story',
      title: s.name,
      to: getStoryLink(s),
      meta: s.author?.name,
      image: s.picture?.link,
    }));

    if (!q) {
      return [
        { label: 'Đi tới', items: pages.slice(0, 6) },
        { label: 'Bài viết mới', items: blogs.slice(0, 4) },
      ].filter(g => g.items.length > 0);
    }
    return [
      { label: 'Trang', items: searchItems(pages, query, p => `${p.title} ${p.keywords ?? ''}`).slice(0, 5) },
      { label: 'Blog', items: searchItems(blogs, query, b => `${b.title} ${b.meta ?? ''}`).slice(0, 6) },
      { label: 'Truyện', items: searchItems(stories, query, s => `${s.title} ${s.meta ?? ''}`).slice(0, 6) },
    ].filter(g => g.items.length > 0);
  }, [query, content, toggleMode]);

  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function select(item) {
    onClose();
    if (item.run) {
      item.run();
      return;
    }
    navigate(item.to);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(i => (flat.length ? (i + 1) % flat.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(i => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (event.key === 'Enter' && flat[activeIndex]) {
      event.preventDefault();
      select(flat[activeIndex]);
    }
  }

  let index = -1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ className: styles.paper }}
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start' } }}
    >
      <div className={styles.searchRow}>
        <IoSearchOutline className={styles.searchIcon} />
        <input
          autoFocus
          className={styles.input}
          placeholder="Tìm bài viết, truyện, trang…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Tìm kiếm"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-palette-list"
          aria-activedescendant={flat[activeIndex] ? `cmd-item-${activeIndex}` : undefined}
        />
        <kbd className={styles.kbd}>Esc</kbd>
      </div>

      <div className={styles.list} ref={listRef} id="command-palette-list" role="listbox">
        {groups.map(group => (
          <div key={group.label} className={styles.group} role="group" aria-label={group.label}>
            <div className={styles.groupLabel}>{group.label}</div>
            {group.items.map(item => {
              index += 1;
              const itemIndex = index;
              return (
                <button
                  type="button"
                  key={`${item.kind}-${item.to ?? item.title}`}
                  id={`cmd-item-${itemIndex}`}
                  data-index={itemIndex}
                  role="option"
                  aria-selected={itemIndex === activeIndex}
                  className={clsx(styles.item, itemIndex === activeIndex && styles.active)}
                  onMouseMove={() => setActiveIndex(itemIndex)}
                  onClick={() => select(item)}
                >
                  {item.kind === 'page' ? (
                    <span className={styles.itemIcon}>{item.icon}</span>
                  ) : (
                    <span className={styles.thumb}>
                      {item.image
                        ? <img src={item.image} alt="" loading="lazy" />
                        : (item.kind === 'blog' ? <IoNewspaperOutline /> : <IoLibraryOutline />)}
                    </span>
                  )}
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.meta && <span className={styles.itemMeta}>{item.meta}</span>}
                  </span>
                  {itemIndex === activeIndex && <IoReturnDownBack className={styles.enter} aria-hidden />}
                </button>
              );
            })}
          </div>
        ))}
        {flat.length === 0 && (
          <div className={styles.empty}>
            {isLoading ? 'Đang tải…' : <>Không tìm thấy kết quả cho “{query}”.</>}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span><kbd className={styles.kbd}>↑</kbd><kbd className={styles.kbd}>↓</kbd> di chuyển</span>
        <span><kbd className={styles.kbd}>Enter</kbd> mở</span>
        <span className={styles.footerHint}>Gõ không dấu cũng được</span>
      </div>
    </Dialog>
  );
}
