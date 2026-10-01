const SITE = 'FollMe';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Plain-text excerpt of an HTML string. */
export function excerpt(html = '', length = 160) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

/**
 * Sets the page title and the description / Open Graph tags. Crawlers that
 * run JavaScript (Google) pick these up; it also keeps the tab title right.
 */
export function setPageMeta({ title, description, image }) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE}: Chia sẻ câu chuyện của bạn`;
  document.title = fullTitle;
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:url', window.location.href.split('#')[0]);
  if (description) {
    setMeta('name', 'description', description);
    setMeta('property', 'og:description', description);
  }
  if (image) {
    setMeta('property', 'og:image', image);
  }
}
