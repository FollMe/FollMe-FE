/**
 * Records a product event in Vercel Web Analytics (custom events need a
 * Pro plan; on Hobby only page views are kept). Never throws.
 *
 * @param {string} name - e.g. 'invitation_created'
 * @param {Record<string, string|number|boolean>} [data]
 */
export function track(name, data) {
  try {
    if (typeof window !== 'undefined' && typeof window.va === 'function') {
      window.va('event', data ? { name, data } : { name });
    }
  } catch (err) {
    // Analytics must never break the page.
  }
}
