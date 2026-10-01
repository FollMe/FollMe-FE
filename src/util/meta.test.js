import { excerpt, setPageMeta } from './meta';

it('builds a plain-text excerpt', () => {
  expect(excerpt('<p>Xin&nbsp;chào <b>bạn</b></p>')).toBe('Xin chào bạn');
  expect(excerpt(`<p>${'a '.repeat(200)}</p>`, 20)).toHaveLength(20);
});

it('sets title and meta tags', () => {
  setPageMeta({ title: 'Hợp tuổi', description: 'Mô tả' });
  expect(document.title).toBe('Hợp tuổi | FollMe');
  expect(document.head.querySelector('meta[name="description"]').getAttribute('content')).toBe('Mô tả');
  expect(document.head.querySelector('meta[property="og:title"]').getAttribute('content')).toBe('Hợp tuổi | FollMe');
});
