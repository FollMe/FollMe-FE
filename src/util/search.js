/**
 * Lowercases and strips Vietnamese diacritics so "Thần số" matches "than so".
 */
export function normalizeText(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Scores how well `text` matches `query` (0 = no match). Every word of the
 * query must appear; matches at the start of the text or of a word rank
 * higher.
 */
export function matchScore(query, text) {
  const q = normalizeText(query);
  if (!q) {
    return 0;
  }
  const t = normalizeText(text);
  const words = q.split(/\s+/);
  let score = 0;
  for (const word of words) {
    const index = t.indexOf(word);
    if (index < 0) {
      return 0;
    }
    score += 1;
    if (index === 0) {
      score += 2;
    } else if (t[index - 1] === ' ') {
      score += 1;
    }
  }
  if (t.includes(q)) {
    score += 2;
  }
  return score;
}

/**
 * Returns the items matching the query, best first.
 *
 * @param {Array} items
 * @param {string} query
 * @param {(item) => string} getText - text to search in
 */
export function searchItems(items, query, getText) {
  return items
    .map(item => ({ item, score: matchScore(query, getText(item)) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item);
}
