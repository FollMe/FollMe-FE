import { NOTE_KINDS, newNoteRow, noteKind, tidyNotes, toNoteRows } from './notes';

describe('notes for guests', () => {
  it('offers the usual topics', () => {
    expect(NOTE_KINDS.map(k => k.kind)).toEqual(['dress', 'parking', 'kids', 'stay', 'other']);
    expect(noteKind('parking').label).toBe('Gửi xe');
    expect(noteKind('nope').kind).toBe('other');
  });

  it('round-trips and tidies like the server', () => {
    const rows = [
      ...toNoteRows([{ kind: 'dress', text: 'Tông pastel' }]),
      { ...newNoteRow('other'), title: '  Chụp  ảnh ', text: 'Góc chụp ảnh ở sảnh\n\n\n\nnhé ' },
      { ...newNoteRow('other'), text: 'No title' },
      newNoteRow('kids'),
    ];
    expect(rows[0]).toMatchObject({ kind: 'dress', title: '', text: 'Tông pastel' });
    expect(tidyNotes(rows)).toEqual([
      { kind: 'dress', text: 'Tông pastel' },
      { kind: 'other', title: 'Chụp ảnh', text: 'Góc chụp ảnh ở sảnh\n\nnhé' },
    ]);
  });
});
