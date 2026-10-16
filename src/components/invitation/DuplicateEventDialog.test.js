import { titleSuggestions } from './DuplicateEventDialog';

describe('titleSuggestions', () => {
  it('offers the other ceremonies of a wedding, not the current one', () => {
    expect(titleSuggestions({ type: 'wedding', groomName: 'Minh', brideName: 'Lan', title: 'Lễ thành hôn Minh & Lan' }))
      .toEqual(['Lễ vu quy Minh & Lan', 'Tiệc báo hỷ Minh & Lan']);
    expect(titleSuggestions({ type: 'engagement', groomName: 'Minh', brideName: 'Lan', title: 'x' }))
      .toEqual(['Lễ ăn hỏi Minh & Lan', 'Tiệc thân mật Minh & Lan']);
  });

  it('has none for other events or without both names', () => {
    expect(titleSuggestions({ type: 'birthday', title: 'Sinh nhật' })).toEqual([]);
    expect(titleSuggestions({ type: 'wedding', groomName: 'Minh', brideName: '', title: 'x' })).toEqual([]);
  });
});
