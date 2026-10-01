import { getBookmarks, getHistory, isBookmarked, recordRead, toggleBookmark } from './readingList';

beforeEach(() => localStorage.clear());

describe('bookmarks', () => {
  it('toggles', () => {
    const item = { key: 'blog:a', type: 'blog', title: 'A', to: '/blogs/a' };
    expect(toggleBookmark(item)).toBe(true);
    expect(isBookmarked('blog:a')).toBe(true);
    expect(toggleBookmark(item)).toBe(false);
    expect(getBookmarks()).toEqual([]);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('follme.bookmarks', '{nope');
    expect(getBookmarks()).toEqual([]);
  });
});

describe('history', () => {
  it('keeps one entry per post, newest first, capped', () => {
    recordRead({ key: 'story:s', title: 'S', to: '/c1', subtitle: 'Chương 1' });
    recordRead({ key: 'blog:b', title: 'B', to: '/blogs/b' });
    recordRead({ key: 'story:s', title: 'S', to: '/c2', subtitle: 'Chương 2' });
    const history = getHistory();
    expect(history.map(i => i.key)).toEqual(['story:s', 'blog:b']);
    expect(history[0].to).toBe('/c2');
    for (let i = 0; i < 20; i++) {
      recordRead({ key: `blog:${i}`, title: `${i}`, to: `/${i}` });
    }
    expect(getHistory()).toHaveLength(12);
  });
});
