import { matchScore, normalizeText, searchItems } from './search';

describe('normalizeText', () => {
  it('strips Vietnamese diacritics and đ', () => {
    expect(normalizeText('  Thần Số Học – Đường đời ')).toBe('than so hoc – duong doi');
  });
});

describe('matchScore', () => {
  it('matches without accents and requires every word', () => {
    expect(matchScore('than so', 'Thần số học')).toBeGreaterThan(0);
    expect(matchScore('than toan', 'Thần số học')).toBe(0);
    expect(matchScore('', 'Thần số học')).toBe(0);
  });

  it('ranks prefix and word-start matches higher', () => {
    expect(matchScore('git', 'Git cơ bản')).toBeGreaterThan(matchScore('git', 'Học về digit'));
  });
});

describe('searchItems', () => {
  it('returns matches best first', () => {
    const items = [{ t: 'Thiết kế cơ sở dữ liệu' }, { t: 'Dữ liệu lớn' }, { t: 'Git' }];
    expect(searchItems(items, 'du lieu', i => i.t).map(i => i.t)).toEqual(['Dữ liệu lớn', 'Thiết kế cơ sở dữ liệu']);
  });
});
