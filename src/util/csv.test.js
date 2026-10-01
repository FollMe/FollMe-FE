import { csvCell, toCsv } from './csv';

describe('csvCell', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('Cô Ba, chú Tư')).toBe('"Cô Ba, chú Tư"');
    expect(csvCell('Anh "Bin"')).toBe('"Anh ""Bin"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
    expect(csvCell(3)).toBe('3');
    expect(csvCell(undefined)).toBe('');
  });

  it('defuses spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+84 912')).toBe("'+84 912");
    expect(csvCell('@me')).toBe("'@me");
  });
});

describe('toCsv', () => {
  it('joins rows with CRLF', () => {
    expect(toCsv([['Tên', 'Số người'], ['An', 2]])).toBe('Tên,Số người\r\nAn,2');
  });
});
