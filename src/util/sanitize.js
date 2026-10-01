import DOMPurify from 'dompurify';

// Blogs and comments are HTML written by any signed-up user and rendered
// with dangerouslySetInnerHTML, while the session token sits in
// localStorage. Everything user-written goes through here before it reaches
// the DOM.

/**
 * HTML of a blog post (Quill output: headings, lists, links, images, colors,
 * code), without scripts, event handlers or javascript: links.
 *
 * @param {string} html
 * @returns {string}
 */
export function sanitizeArticle(html = '') {
  return DOMPurify.sanitize(html ?? '', {
    // Quill opens links in a new tab
    ADD_ATTR: ['target'],
  });
}

/**
 * HTML of a comment: text, line breaks and @mention chips only.
 *
 * @param {string} html
 * @returns {string}
 */
export function sanitizeComment(html = '') {
  return DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: ['br', 'div', 'p', 'span'],
    ALLOWED_ATTR: ['class'],
  });
}

/**
 * Escapes text for use inside HTML, e.g. a user's name in a mention chip.
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text = '') {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
