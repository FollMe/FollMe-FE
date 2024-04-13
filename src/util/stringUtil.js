/**
 * Returns the host URL of the current window.
 *
 * @returns {string} The host URL of the current window.
 */
export function getHostURL() {
  const { protocol, host } = window.location;
  return `${protocol}//${host}`;
}