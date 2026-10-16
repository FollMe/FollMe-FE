import { BOOK_ACCENTS, bookCount, bookWishes } from './guestbook';

const wishes = [
  { _id: 'c', createdAt: '2027-01-16T12:00:00Z' },
  { _id: 'a', createdAt: '2027-01-02T08:00:00Z' },
  { _id: 'h', createdAt: '2027-01-10T08:00:00Z', isHidden: true },
  { _id: 'b', createdAt: '2027-01-05T08:00:00Z' },
];

describe('guestbook', () => {
  it('prints wishes oldest first, without hidden ones unless asked', () => {
    expect(bookWishes(wishes).map(w => w._id)).toEqual(['a', 'b', 'c']);
    expect(bookWishes(wishes, { includeHidden: true }).map(w => w._id)).toEqual(['a', 'b', 'h', 'c']);
    expect(bookWishes()).toEqual([]);
    // The list it was given stays as it was
    expect(wishes[0]._id).toBe('c');
  });

  it('counts and inks', () => {
    expect(bookCount(128)).toBe('128 lời chúc từ những người thương');
    expect(bookCount(0)).toBe('Chưa có lời chúc nào');
    expect(Object.keys(BOOK_ACCENTS)).toEqual(['blush', 'classic', 'minimal', 'night']);
  });
});
