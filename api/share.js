// Vercel serverless function: serves the app's index.html with page-specific
// <title>, description and Open Graph tags, so links pasted into Zalo,
// Messenger or Facebook (whose crawlers do not run JavaScript) show a real
// preview. Humans get the same HTML and the React app takes over as usual.
//
// Routed from vercel.json. Any failure falls back to the plain index.html.

const SITE = 'FollMe';
const DEFAULT_IMAGE = '/imgs/og-default.png';
const WEDDING_IMAGE = '/imgs/og-wedding.png';

// Pages whose preview does not depend on data.
const PAGES = {
  '/cuoi-hoi': {
    title: 'Cưới hỏi: xem tuổi, chọn ngày, thiệp cưới online',
    description: 'Chuẩn bị đám cưới trong ba bước: xem tuổi hợp nhau, chọn ngày cưới đẹp theo tuổi và gửi thiệp cưới online miễn phí.',
    image: WEDDING_IMAGE,
  },
  '/cuoi-hoi/chon-ngay': {
    title: 'Chọn ngày cưới đẹp theo tuổi',
    description: 'Tìm ngày cưới hoàng đạo, không xung tuổi cô dâu chú rể, tránh tháng cô hồn, Tam Nương, Nguyệt Kỵ, kèm giờ tốt và cảnh báo Kim Lâu.',
    image: WEDDING_IMAGE,
  },
  '/fortune/hop-tuoi': {
    title: 'Xem tuổi hợp nhau',
    description: 'Hai bạn hợp nhau mấy điểm? Xem độ hợp theo con giáp, thiên can, mệnh và thần số học, kèm lời giải thích dễ hiểu.',
  },
  '/fortune/lich': {
    title: 'Lịch vạn niên & tử vi hôm nay 12 con giáp',
    description: 'Lịch âm hôm nay, ngày hoàng đạo, giờ tốt, tiết khí và tử vi hằng ngày cho 12 con giáp.',
  },
};

let indexCache = null;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setTag(html, pattern, tag) {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

/** Replaces the title, description and OG/Twitter tags of the page. */
function injectMeta(html, meta, url) {
  const title = escapeHtml(meta.title ? `${meta.title} | ${SITE}` : `${SITE}: Xem tuổi, chọn ngày cưới & thiệp cưới online`);
  const description = escapeHtml(meta.description || '');
  const image = escapeHtml(meta.image || DEFAULT_IMAGE);
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out = setTag(out, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`);
  out = setTag(out, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  out = setTag(out, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`);
  out = setTag(out, /<meta name="twitter:card"[^>]*>/, '<meta name="twitter:card" content="summary_large_image" />');
  if (description) {
    out = setTag(out, /<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`);
    out = setTag(out, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`);
  }
  return out;
}

async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return null;
    }
    const body = await res.json();
    return body?.meta?.ok ? body.data : null;
  } finally {
    clearTimeout(timer);
  }
}

const ID_RE = /^[a-f0-9]{24}$/i;

/** Only https images from our photo host make it into the page. */
function safeImage(url) {
  return typeof url === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(url) ? url : '';
}
const SLUG_RE = /^[a-z0-9-]{1,200}$/i;

/** Works out the preview for a path, or null for the site default. */
async function resolveMeta(pathname, apiBase) {
  if (PAGES[pathname]) {
    return PAGES[pathname];
  }
  let m = pathname.match(/^\/(invitations|e)\/([^/]+)$/);
  if (m && ID_RE.test(m[2]) && apiBase) {
    const path = m[1] === 'e' ? `api/events/${m[2]}/preview` : `api/invitations/${m[2]}/preview`;
    const data = await getJson(`${apiBase}/${path}`);
    if (data) {
      const wedding = data.type === 'wedding' || data.type === 'engagement';
      // The couple's cover photo when there is one
      const fallback = wedding ? WEDDING_IMAGE : DEFAULT_IMAGE;
      return { title: data.title, description: data.description, image: safeImage(data.image) || fallback };
    }
    return null;
  }
  m = pathname.match(/^\/blogs\/([^/]+)$/);
  if (m && SLUG_RE.test(m[1]) && apiBase) {
    const data = await getJson(`${apiBase}/api/blogs/${m[1]}/preview`);
    if (data) {
      return { title: data.title, description: data.description, image: data.image || DEFAULT_IMAGE };
    }
  }
  return null;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url}: ${res.status}`);
  }
  return res.text();
}

/**
 * The built index.html of this deployment. Preview deployments behind
 * Vercel Authentication refuse the self-fetch, so fall back to production.
 */
async function loadIndex(origin) {
  if (indexCache) {
    return indexCache;
  }
  const candidates = [`${origin}/index.html`];
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    candidates.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/index.html`);
  }
  for (const url of candidates) {
    try {
      indexCache = await fetchText(url);
      return indexCache;
    } catch (err) {
      // try the next one
    }
  }
  throw new Error('index.html not reachable');
}

async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  // vercel.json passes the original path as ?path=
  const url = new URL(req.url, origin);
  const pathname = (url.searchParams.get('path') || '/').replace(/\/+$/, '') || '/';
  const apiBase = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

  let html;
  try {
    html = await loadIndex(origin);
  } catch (err) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    res.end();
    return;
  }

  let meta = null;
  try {
    meta = await resolveMeta(pathname, apiBase);
  } catch (err) {
    meta = null;
  }
  const out = meta ? injectMeta(html, { ...meta, image: absolute(meta.image, origin) }, `${origin}${pathname}`) : html;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (isPrivatePath(pathname)) {
    // Link previews (Zalo, Messenger) still work; search engines leave it out
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  // Short CDN cache: an edited invitation shows up within minutes.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
  res.end(out);
}

/** Invitations name the guest and the couple: not for search results. */
function isPrivatePath(pathname) {
  return /^\/(invitations|e)\//.test(pathname);
}

function absolute(image, origin) {
  if (!image) {
    return `${origin}${DEFAULT_IMAGE}`;
  }
  return /^https?:\/\//.test(image) ? image : `${origin}${image}`;
}

module.exports = handler;
module.exports.injectMeta = injectMeta;
module.exports.resolveMeta = resolveMeta;
module.exports.isPrivatePath = isPrivatePath;
module.exports.resetCache = () => { indexCache = null; };
