import { addComment } from './comments';

describe('addComment', () => {
  const list = [{ id: 1, replies: [{ id: 2 }] }, { id: 3 }];

  it('appends a top-level comment', () => {
    expect(addComment(list, { id: 4 }).map(c => c.id)).toEqual([1, 3, 4]);
  });

  it('appends a reply without touching the original list', () => {
    const out = addComment(list, { id: 5 }, 3);
    expect(out[1].replies.map(r => r.id)).toEqual([5]);
    expect(list[1].replies).toBeUndefined();
  });

  it('ignores a comment it already has', () => {
    expect(addComment(list, { id: 3 })).toBe(list);
    expect(addComment(list, { id: 2 }, 1)).toBe(list);
  });

  it('ignores a reply to a comment it does not have', () => {
    expect(addComment(list, { id: 6 }, 99)).toBe(list);
  });
});
