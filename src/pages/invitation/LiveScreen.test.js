import { mergeWishes, spotSize } from './LiveScreen';
import { moveItem } from 'components/invitation/PhotoManager';

const wish = (id, at, extra = {}) => ({ _id: id, name: id, message: 'Chúc mừng', createdAt: at, ...extra });

describe('mergeWishes', () => {
  const list = [wish('b', '2027-01-10T10:02:00Z'), wish('a', '2027-01-10T10:01:00Z')];

  it('adds unseen wishes, newest first, and reports them', () => {
    const { list: next, added } = mergeWishes(list, [wish('c', '2027-01-10T10:03:00Z')]);
    expect(next.map(w => w._id)).toEqual(['c', 'b', 'a']);
    expect(added.map(w => w._id)).toEqual(['c']);
  });

  it('drops wishes the host hid and ignores repeats from overlapping polls', () => {
    const { list: next, added } = mergeWishes(list, [
      wish('a', '2027-01-10T10:01:00Z', { isHidden: true }),
      wish('b', '2027-01-10T10:02:00Z'),
    ]);
    expect(next.map(w => w._id)).toEqual(['b']);
    expect(added).toEqual([]);
  });

  it('brings back a wish shown again', () => {
    const { list: next, added } = mergeWishes([list[0]], [list[1]]);
    expect(next.map(w => w._id)).toEqual(['b', 'a']);
    expect(added.map(w => w._id)).toEqual(['a']);
  });
});

describe('spotSize', () => {
  it('shrinks long wishes', () => {
    expect(spotSize('Chúc mừng hạnh phúc!')).toBe('large');
    expect(spotSize('x'.repeat(120))).toBe('medium');
    expect(spotSize('x'.repeat(400))).toBe('small');
  });
});

describe('moveItem', () => {
  it('moves one item and keeps the rest in order', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 2, 0)).toEqual(['c', 'a', 'b', 'd']);
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });
});
