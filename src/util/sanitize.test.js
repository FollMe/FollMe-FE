import { escapeHtml, sanitizeArticle, sanitizeComment } from './sanitize';

describe('sanitizeArticle', () => {
  it('keeps what the Quill editor produces', () => {
    const html = '<h2>Tiêu đề</h2><p class="ql-align-center"><strong>Đậm</strong> <span style="color: rgb(230, 0, 0);">màu</span></p>'
      + '<ol><li>Một</li></ol><blockquote>Trích</blockquote><pre class="ql-syntax">code</pre>'
      + '<p><a href="https://follme.vn" rel="noopener noreferrer" target="_blank">link</a></p>'
      + '<p><img src="data:image/png;base64,iVBORw0KGgo=" width="300"></p>';
    expect(sanitizeArticle(html)).toBe(html);
  });

  it('removes scripts, event handlers and javascript: links', () => {
    const out = sanitizeArticle(
      '<p>Hi<script>steal()</script></p><img src="x" onerror="steal()"><a href="javascript:steal()">x</a><iframe src="https://evil"></iframe>',
    );
    expect(out).not.toMatch(/script|onerror|javascript:|iframe/i);
    expect(out).toContain('<p>Hi</p>');
  });

  it('copes with a missing body', () => {
    expect(sanitizeArticle(undefined)).toBe('');
    expect(sanitizeArticle(null)).toBe('');
  });
});

describe('sanitizeComment', () => {
  it('keeps text, line breaks and mention chips', () => {
    const html = 'Chào <span class="cmt-tag">Minh​</span><div>dòng 2<br></div>';
    expect(sanitizeComment(html)).toBe(html);
  });

  it('drops everything else but keeps the text', () => {
    const out = sanitizeComment('<img src=x onerror="steal()"><a href="https://x">bấm</a><b>đậm</b><style>*{}</style>');
    expect(out).toBe('bấmđậm');
  });
});

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
  });
});
