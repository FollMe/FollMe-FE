import { SUGGESTED_MENU, menuOpen, tidyMenu, toMenuRows } from './menu';

describe('menu', () => {
  it('round-trips the rows, one line per dish', () => {
    const rows = [...toMenuRows(['Súp cua']), { dish: '  Lẩu \n hải sản ', id: 'x' }, { dish: ' ', id: 'y' }];
    expect(rows[0]).toMatchObject({ dish: 'Súp cua' });
    expect(tidyMenu(rows)).toEqual(['Súp cua', 'Lẩu hải sản']);
    expect(SUGGESTED_MENU.length).toBeGreaterThan(5);
  });

  it('shows on the card from the day before to the end of the party', () => {
    const start = Date.parse('2027-01-16T04:00:00Z');
    expect(menuOpen(start, start - 25 * 3600e3)).toBe(false);
    expect(menuOpen(start, start - 23 * 3600e3)).toBe(true);
    expect(menuOpen(start, start + 7 * 3600e3)).toBe(true);
    expect(menuOpen(start, start + 9 * 3600e3)).toBe(false);
  });
});
