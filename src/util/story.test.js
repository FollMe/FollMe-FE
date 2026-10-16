import { moveRow, tidyStory, toStoryRows } from './story';

describe('the couple\'s story', () => {
  it('saves what the server keeps', () => {
    expect(tidyStory([
      { when: '  Mùa thu   2019 ', title: ' Lần đầu   gặp nhau ', text: 'Quán cà phê   nhỏ\n\n\n\nở Đà Lạt.  ' },
      { when: '2020', title: '  ', text: 'không tiêu đề' },
      { when: '', title: 'Ngày cầu hôn', text: '' },
    ])).toEqual([
      { when: 'Mùa thu 2019', title: 'Lần đầu gặp nhau', text: 'Quán cà phê nhỏ\n\nở Đà Lạt.' },
      { title: 'Ngày cầu hôn' },
    ]);
  });

  it('rows round-trip and move', () => {
    const rows = toStoryRows([{ title: 'A' }, { when: '2021', title: 'B' }]);
    expect(rows.map(r => r.title)).toEqual(['A', 'B']);
    expect(rows[0]).toMatchObject({ when: '', text: '' });
    expect(moveRow(rows, 1, -1).map(r => r.title)).toEqual(['B', 'A']);
    expect(moveRow(rows, 0, -1)).toBe(rows);
  });
});
