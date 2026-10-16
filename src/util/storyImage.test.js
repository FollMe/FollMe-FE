import { STORY_PALETTES, fitSize, storyDate, storyFilename, wrapLines } from './storyImage';
import { THEMES } from './invitation';

/** A canvas context whose text is 0.5 × the font size wide per character. */
function fakeCtx() {
  const ctx = { font: '10px x' };
  ctx.measureText = text => ({ width: text.length * 0.5 * Number(/(\d+)px/.exec(ctx.font)[1]) });
  return ctx;
}

describe('storyImage', () => {
  it('shrinks text until it fits, not below the minimum', () => {
    const ctx = fakeCtx();
    const font = s => `${s}px serif`;
    // 10 characters at 100px = 500 wide
    expect(fitSize(ctx, 'abcdefghij', 600, 100, font)).toBe(100);
    expect(fitSize(ctx, 'abcdefghij', 400, 100, font)).toBe(80);
    expect(fitSize(ctx, 'abcdefghij', 10, 100, font, 40)).toBe(40);
  });

  it('wraps words, ending the last kept line in an ellipsis', () => {
    const ctx = fakeCtx();
    ctx.font = '20px x';
    // 10 px a character: 100 px holds 10 characters
    expect(wrapLines(ctx, 'Nhà hàng Hoa Sen, 12 Lê Lợi', 100, 3)).toEqual(['Nhà hàng', 'Hoa Sen,', '12 Lê Lợi']);
    const two = wrapLines(ctx, 'Nhà hàng Hoa Sen, 12 Lê Lợi, Quận 1', 100, 2);
    expect(two).toHaveLength(2);
    expect(two[1].endsWith('…')).toBe(true);
    expect(two[1].length).toBeLessThanOrEqual(10);
    expect(wrapLines(ctx, '', 100, 2)).toEqual([]);
  });

  it('reads the date in Vietnam', () => {
    expect(storyDate('2027-01-16T04:00:00.000Z')).toEqual({ day: 'THỨ BẢY · 16.01.2027', time: '11:00' });
    expect(storyDate('2027-01-16T17:30:00.000Z')).toEqual({ day: 'CHỦ NHẬT · 17.01.2027', time: '00:30' });
  });

  it('names the file without accents', () => {
    expect(storyFilename('Đức & Hạnh', 'story')).toBe('save-the-date-duc-hanh.png');
    expect(storyFilename('Sinh nhật Vy', 'square')).toBe('save-the-date-sinh-nhat-vy-vuong.png');
    expect(storyFilename('', 'story')).toBe('save-the-date.png');
  });

  it('has a palette for every theme', () => {
    expect(THEMES.every(t => STORY_PALETTES[t.value])).toBe(true);
  });
});
