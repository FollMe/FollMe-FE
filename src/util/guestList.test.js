import {
  appendNames, countByGroup, lineAt, parseGroupHeader, parseGuestLine, parseGuestList, withPrefix, withSuffix,
} from './guestList';

describe('parseGuestLine', () => {
  it('cleans up list markers and spaces', () => {
    expect(parseGuestLine('1. Cô Ba')).toEqual({ name: 'Cô Ba' });
    expect(parseGuestLine('  12)  Anh   Tuấn ')).toEqual({ name: 'Anh Tuấn' });
    expect(parseGuestLine('- Chị Lan')).toEqual({ name: 'Chị Lan' });
    expect(parseGuestLine('• Bác Hai')).toEqual({ name: 'Bác Hai' });
    expect(parseGuestLine('   ')).toBeNull();
  });

  it('keeps names that only look like numbers', () => {
    expect(parseGuestLine('Nhóm 12A1')).toEqual({ name: 'Nhóm 12A1' });
    expect(parseGuestLine('Anh Tuấn, chị Lan')).toEqual({ name: 'Anh Tuấn, chị Lan' });
  });

  it('takes the first cell of a row pasted from Excel', () => {
    expect(parseGuestLine('Cô Ba\t0912345678\tNhà trai')).toEqual({ name: 'Cô Ba' });
  });

  it('still reads "Tên | email"', () => {
    expect(parseGuestLine('Anh Tuấn | Tuan@Example.com')).toEqual({ name: 'Anh Tuấn', email: 'tuan@example.com' });
    expect(parseGuestLine('Anh Tuấn | not-an-email')).toEqual({ name: 'Anh Tuấn' });
  });
});

describe('parseGuestList', () => {
  it('reads one guest per line and drops repeats', () => {
    const res = parseGuestList('Cô Ba\n\nAnh Tuấn\r\ncô ba\nChị Lan');
    expect(res.guests.map(g => g.name)).toEqual(['Cô Ba', 'Anh Tuấn', 'Chị Lan']);
    expect(res.repeated).toEqual(['cô ba']);
  });

  it('skips guests already invited and flags names too long', () => {
    const res = parseGuestList(`Cô Ba\nChú Tư\n${'A'.repeat(101)}`, ['cô ba']);
    expect(res.guests.map(g => g.name)).toEqual(['Chú Tư']);
    expect(res.alreadyInvited).toEqual(['Cô Ba']);
    expect(res.tooLong).toHaveLength(1);
  });
});

describe('groups', () => {
  it('reads a line ending with a colon as a group', () => {
    expect(parseGroupHeader('Nhà trai:')).toBe('Nhà trai');
    expect(parseGroupHeader('  Bạn   cô dâu :  ')).toBe('Bạn cô dâu');
    expect(parseGroupHeader('1. Đồng nghiệp:')).toBe('Đồng nghiệp');
    expect(parseGroupHeader('Nhà gái：')).toBe('Nhà gái');
    expect(parseGroupHeader('Cô Ba')).toBeNull();
    expect(parseGroupHeader(':')).toBeNull();
    expect(parseGroupHeader(`${'G'.repeat(41)}:`)).toBeNull();
    expect(parseGroupHeader('Anh Tuấn | tuan@x.vn:')).toBeNull();
  });

  it('puts guests under the header above them', () => {
    const text = 'Cô Ba\nNhà trai:\n1. Chú Tư\n2. Bác Hai\n\nNhà gái:\n- Chị Lan\n';
    const res = parseGuestList(text, [], 'Bạn bè');
    expect(res.guests).toEqual([
      { name: 'Cô Ba', group: 'Bạn bè' },
      { name: 'Chú Tư', group: 'Nhà trai' },
      { name: 'Bác Hai', group: 'Nhà trai' },
      { name: 'Chị Lan', group: 'Nhà gái' },
    ]);
    expect(countByGroup(res.guests)).toEqual([['Bạn bè', 1], ['Nhà trai', 2], ['Nhà gái', 1]]);
  });

  it('leaves guests without a group when there is none', () => {
    expect(parseGuestList('Cô Ba\nChú Tư').guests).toEqual([{ name: 'Cô Ba' }, { name: 'Chú Tư' }]);
    expect(countByGroup([{ name: 'A' }, { name: 'B', group: 'X' }])).toEqual([['', 1], ['X', 1]]);
  });
});

describe('line editing', () => {
  it('finds the line around the caret', () => {
    const text = 'Cô Ba\nTuấn\nLan';
    expect(lineAt(text, 8)).toEqual({ start: 6, end: 10 });
    expect(lineAt(text, 0)).toEqual({ start: 0, end: 5 });
    expect(lineAt(text, text.length)).toEqual({ start: 11, end: 14 });
    expect(lineAt('Cô Ba\n', 6)).toEqual({ start: 6, end: 6 });
  });

  it('adds or swaps a prefix', () => {
    expect(withPrefix('Tuấn', 'Anh')).toBe('Anh Tuấn');
    expect(withPrefix('anh Tuấn', 'Chú')).toBe('Chú Tuấn');
    expect(withPrefix('Gia đình Tuấn', 'Bác')).toBe('Bác Tuấn');
    expect(withPrefix('', 'Cô')).toBe('Cô ');
    expect(withPrefix('Anhthư', 'Chị')).toBe('Chị Anhthư');
    // on a pasted numbered line, the number goes
    expect(withPrefix('2. Tuấn', 'Anh')).toBe('Anh Tuấn');
  });

  it('adds or swaps a suffix', () => {
    expect(withSuffix('Anh Tuấn', '& người thương')).toBe('Anh Tuấn & người thương');
    expect(withSuffix('Anh Tuấn & người thương', '& gia đình')).toBe('Anh Tuấn & gia đình');
    expect(withSuffix('  ', '& gia đình')).toBe('  ');
  });

  it('appends names on new lines', () => {
    expect(appendNames('', ['Cô Ba', ' Tuấn '])).toBe('Cô Ba\nTuấn\n');
    expect(appendNames('Lan\n\n', ['Cô Ba'])).toBe('Lan\nCô Ba\n');
    expect(appendNames('Lan', [])).toBe('Lan');
  });
});
