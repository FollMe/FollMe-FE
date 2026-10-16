// "Chuyện tình yêu": a few moments of the couple's story, in their order,
// shown on the wedding invitation.

export const MAX_STORY_ITEMS = 8;
export const MAX_STORY_WHEN = 30;
export const MAX_STORY_TITLE = 60;
export const MAX_STORY_TEXT = 300;

/** Moments couples usually tell, offered a tap away. */
export const STORY_PROMPTS = [
  'Lần đầu gặp nhau',
  'Buổi hẹn hò đầu tiên',
  'Ngày tỏ tình',
  'Chuyến đi đáng nhớ',
  'Ra mắt hai gia đình',
  'Ngày cầu hôn',
  'Về chung một nhà',
];

let nextId = 0;
/** Rows of the form carry an id, so React keeps each row's inputs as they move. */
export const toStoryRows = (story = []) => story.map(item => ({
  when: item.when ?? '', title: item.title ?? '', text: item.text ?? '', id: `s${nextId++}`,
}));

/** The story to save, as the server keeps it: one-line when and title, no untitled moments. */
export function tidyStory(rows = []) {
  const line = value => (value ?? '').replace(/\s+/g, ' ').trim();
  return rows
    .map(row => ({
      when: line(row.when),
      title: line(row.title),
      text: (row.text ?? '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
    }))
    .filter(item => item.title)
    .map(({ when, title, text }) => ({ ...(when ? { when } : {}), title, ...(text ? { text } : {}) }));
}

/** Moves the row at `index` one step up (-1) or down (+1). */
export function moveRow(rows, index, step) {
  const to = index + step;
  if (to < 0 || to >= rows.length) {
    return rows;
  }
  const next = [...rows];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
