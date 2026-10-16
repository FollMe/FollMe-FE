import { sharedInvitationUrl, slugError, slugify, suggestSlug } from './invitation';

describe('short links', () => {
  it('slugify drops accents, case and punctuation', () => {
    expect(slugify('Minh & Lan')).toBe('minh-lan');
    expect(slugify('  Đức   Hạnh!! ')).toBe('duc-hanh');
    expect(slugify('Lễ thành hôn Trường & Ngọc Ánh 2026')).toBe('le-thanh-hon-truong-ngoc-anh-2026');
    expect(slugify('x'.repeat(45))).toHaveLength(40);
    // Never ends on a hyphen once cut
    expect(slugify(`${'a'.repeat(39)} b`)).toBe('a'.repeat(39));
  });

  it('suggests the couple, else the title', () => {
    expect(suggestSlug({ type: 'wedding', groomName: 'Phúc', brideName: 'Thảo', title: 'x' })).toBe('phuc-thao');
    expect(suggestSlug({ type: 'birthday', title: 'Sinh nhật bé Na' })).toBe('sinh-nhat-be-na');
  });

  it('says what is wrong with a link', () => {
    expect(slugError('minh-lan')).toBeNull();
    expect(slugError('ml')).toMatch(/ít nhất 3/);
    expect(slugError('minh--lan')).toMatch(/chữ thường/);
    expect(slugError('-minh')).toMatch(/chữ thường/);
    expect(slugError('x'.repeat(41))).toMatch(/tối đa 40/);
  });

  it('shares the short link once there is one', () => {
    expect(sharedInvitationUrl({ _id: 'e1' })).toBe('http://localhost/e/e1');
    expect(sharedInvitationUrl({ _id: 'e1', slug: 'minh-lan' })).toBe('http://localhost/c/minh-lan');
  });
});
