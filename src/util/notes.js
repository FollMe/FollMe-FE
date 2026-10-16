// "Lưu ý cho khách": short notes on the card by topic (what to wear, where
// to park, kids, a place to stay for guests from afar) or the host's own.

export const MAX_NOTES = 6;
export const MAX_NOTE_TITLE = 60;
export const MAX_NOTE_TEXT = 300;

/** The topics offered, in order, with what hosts usually write. 'other' takes a title. */
export const NOTE_KINDS = [
  { kind: 'dress', label: 'Trang phục', placeholder: 'Tông màu pastel, nhẹ nhàng. Mong mọi người tránh mặc trắng nhé!' },
  { kind: 'parking', label: 'Gửi xe', placeholder: 'Có hầm gửi xe máy và ô tô miễn phí ở tầng B1.' },
  { kind: 'kids', label: 'Trẻ em', placeholder: 'Rất hoan nghênh các bé, có khu vui chơi riêng gần sân khấu.' },
  { kind: 'stay', label: 'Chỗ nghỉ', placeholder: 'Khách ở xa có thể nghỉ tại khách sạn gần tiệc, báo trước để gia đình đặt phòng giúp.' },
  { kind: 'other', label: 'Mục khác', placeholder: 'Vài dòng cho khách' },
];

export const noteKind = kind => NOTE_KINDS.find(k => k.kind === kind) ?? NOTE_KINDS[NOTE_KINDS.length - 1];

let nextId = 0;
/** Form rows from the event's notes, each with a React id. */
export function toNoteRows(notes = []) {
  return notes.map(note => ({ kind: note.kind, title: note.title ?? '', text: note.text ?? '', id: `n${nextId++}` }));
}

export function newNoteRow(kind) {
  return { kind, title: '', text: '', id: `n${nextId++}` };
}

/** What is saved, as the server keeps it: no empty notes; the host's own need a title. */
export function tidyNotes(rows = []) {
  return rows
    .map(row => {
      const title = row.kind === 'other' ? (row.title ?? '').replace(/\s+/g, ' ').trim() : '';
      const text = (row.text ?? '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      return { kind: row.kind, ...(title ? { title } : {}), text };
    })
    .filter(note => note.text && (note.kind !== 'other' || note.title));
}
