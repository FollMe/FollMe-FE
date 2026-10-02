/**
 * @jest-environment node
 */
// Tests the Vercel function in api/share.js (outside src, plain Node).
const handler = require('../../api/share');

const INDEX = `<!DOCTYPE html><html><head>
<meta name="description" content="Site" />
<meta property="og:title" content="FollMe" />
<meta property="og:description" content="Site" />
<meta property="og:url" content="https://follme.vercel.app/" />
<meta property="og:image" content="https://follme.vercel.app/imgs/og-default.png" />
<meta name="twitter:card" content="summary_large_image" />
<title>FollMe</title></head><body><div id="root"></div></body></html>`;

const EVENT_ID = '64b0000000000000000000e1';

function mockFetch(routes) {
  global.fetch = jest.fn(async (url) => {
    const hit = Object.entries(routes).find(([pattern]) => url.includes(pattern));
    if (!hit) {
      return { ok: false, status: 404 };
    }
    const [, body] = hit;
    return typeof body === 'string'
      ? { ok: true, text: async () => body }
      : { ok: true, json: async () => ({ meta: { ok: true }, data: body }) };
  });
}

async function call(path) {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } };
  await handler({ url: `/api/share?path=${path}`, headers: { host: 'follme.vercel.app', 'x-forwarded-proto': 'https' } }, res);
  return res;
}

beforeEach(() => {
  handler.resetCache();
  process.env.REACT_APP_API_BASE_URL = 'https://api.example.com';
});

it('fills in a wedding invitation preview', async () => {
  mockFetch({
    '/index.html': INDEX,
    [`/api/events/${EVENT_ID}/preview`]: { title: 'Thiệp cưới Minh & Lan', description: '11:00 thứ Bảy, 6/2/2027 · "Hoa Sen" <Q1>', type: 'wedding' },
  });
  const res = await call(`/e/${EVENT_ID}`);
  expect(res.statusCode).toBe(200);
  expect(res.body).toContain('<title>Thiệp cưới Minh &amp; Lan | FollMe</title>');
  expect(res.body).toContain('<meta property="og:description" content="11:00 thứ Bảy, 6/2/2027 · &quot;Hoa Sen&quot; &lt;Q1&gt;" />');
  expect(res.body).toContain('content="https://follme.vercel.app/imgs/og-wedding.png"');
  expect(res.body).toContain(`<meta property="og:url" content="https://follme.vercel.app/e/${EVENT_ID}" />`);
  expect(res.body.match(/og:title/g)).toHaveLength(1);
  expect(res.headers['X-Robots-Tag']).toBe('noindex, nofollow');
});

it('keeps invitations out of search engines, not other pages', () => {
  expect(handler.isPrivatePath(`/invitations/${EVENT_ID}`)).toBe(true);
  expect(handler.isPrivatePath(`/e/${EVENT_ID}`)).toBe(true);
  expect(handler.isPrivatePath('/blogs/git-co-ban')).toBe(false);
  expect(handler.isPrivatePath('/events')).toBe(false);
});

it('uses the blog cover and static pages', async () => {
  mockFetch({
    '/index.html': INDEX,
    '/api/blogs/git-co-ban/preview': { title: 'Git cơ bản', description: 'Commit, branch', image: 'https://cdn.example.com/cover.png' },
  });
  let res = await call('/blogs/git-co-ban');
  expect(res.body).toContain('content="https://cdn.example.com/cover.png"');
  res = await call('/cuoi-hoi/chon-ngay');
  expect(res.body).toContain('<title>Chọn ngày cưới đẹp theo tuổi | FollMe</title>');
  expect(res.headers['X-Robots-Tag']).toBeUndefined();
});

it('serves the plain page when the API fails or the id is bad', async () => {
  mockFetch({ '/index.html': INDEX });
  let res = await call(`/invitations/${EVENT_ID}`);
  expect(res.statusCode).toBe(200);
  expect(res.body).toBe(INDEX);
  res = await call('/invitations/not-an-id');
  expect(res.body).toBe(INDEX);
  expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('not-an-id'), expect.anything());
});

it('falls back to production index, then redirects home', async () => {
  process.env.VERCEL_PROJECT_PRODUCTION_URL = 'follme.vercel.app.prod';
  mockFetch({ 'follme.vercel.app.prod/index.html': INDEX });
  let res = await call('/cuoi-hoi');
  expect(res.statusCode).toBe(200);
  handler.resetCache();
  mockFetch({});
  res = await call('/cuoi-hoi');
  expect(res.statusCode).toBe(302);
  expect(res.headers.Location).toBe('/');
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
});
