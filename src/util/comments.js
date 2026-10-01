/**
 * Returns the list with a new comment added, or the same list if it is
 * already there: whoever posts gets their comment from both the POST response
 * and the websocket broadcast, in either order.
 *
 * @param {Array} list top-level comments, each with optional `replies`
 * @param {{ id: number }} comment
 * @param {number} [parentId] the top-level comment replied to
 * @returns {Array}
 */
export function addComment(list, comment, parentId) {
  if (!parentId) {
    return list.some(c => c.id === comment.id) ? list : [...list, comment];
  }
  const parentIndex = list.findIndex(c => c.id === parentId);
  if (parentIndex < 0) {
    return list;
  }
  const parent = list[parentIndex];
  if (parent.replies?.some(r => r.id === comment.id)) {
    return list;
  }
  const updated = [...list];
  updated[parentIndex] = { ...parent, replies: [...(parent.replies ?? []), comment] };
  return updated;
}
