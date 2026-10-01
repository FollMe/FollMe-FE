import { buildToc } from './toc';

describe('buildToc', () => {
  it('adds unique ids to headings and lists them', () => {
    const { html, headings } = buildToc(
      '<h2>Giới thiệu</h2><p>a</p><h3>Cài đặt</h3><h2>Giới thiệu</h2><h4>bỏ qua</h4><h2> </h2>'
    );
    expect(headings).toEqual([
      { id: 'gioi-thieu', text: 'Giới thiệu', level: 1 },
      { id: 'cai-dat', text: 'Cài đặt', level: 2 },
      { id: 'gioi-thieu-2', text: 'Giới thiệu', level: 1 },
    ]);
    expect(html).toContain('<h2 id="gioi-thieu">Giới thiệu</h2>');
    expect(html).toContain('<h2 id="gioi-thieu-2">');
  });

  it('handles empty content', () => {
    expect(buildToc('')).toEqual({ html: '', headings: [] });
    expect(buildToc('<p>no headings</p>').headings).toEqual([]);
  });
});
