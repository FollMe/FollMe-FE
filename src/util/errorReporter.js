// Sends the JavaScript errors visitors run into to the API, so the team
// hears about a page broken on some phone. A few per page view, each once.

const ENDPOINT = `${process.env.REACT_APP_API_BASE_URL}/api/client-errors`;
const MAX_PER_PAGE = 5;

// Noise nobody can act on: browser extensions, cross-origin scripts
const IGNORED = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /(chrome|moz|safari(-web)?)-extension:\/\//i,
];

const reported = new Set();

/** True when the bundle changed under the visitor (a deploy happened). */
export function isChunkLoadError(error) {
  return error?.name === 'ChunkLoadError'
    || /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i
      .test(String(error?.message ?? ''));
}

/** Reports one error (an Error, or what a promise was rejected with). */
export function reportError(error) {
  try {
    const message = String(error?.message ?? error ?? '').trim().slice(0, 500) || 'Unknown error';
    const stack = String(error?.stack ?? '').slice(0, 4000);
    if (IGNORED.some(re => re.test(message) || re.test(stack))) {
      return;
    }
    if (reported.has(message) || reported.size >= MAX_PER_PAGE) {
      return;
    }
    reported.add(message);
    fetch(ENDPOINT, {
      method: 'POST',
      // Still sent when the visitor is leaving the page
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, stack: stack || undefined, path: window.location.pathname }),
    }).catch(() => {});
  } catch (err) {
    // Reporting must never break the page
  }
}

/** Listens for errors nothing else caught (production builds only). */
export function installErrorReporting() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  window.addEventListener('error', e => reportError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', e => reportError(e.reason));
}

/** Forgets what was sent, for tests. */
export function resetReported() {
  reported.clear();
}
