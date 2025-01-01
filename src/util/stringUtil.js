/**
 * Returns the host URL of the current window.
 *
 * @returns {string} The host URL of the current window.
 */
export function getHostURL() {
  const { protocol, host } = window.location;
  return `${protocol}//${host}`;
}

/**
 * Returns the valid sort value.
 * @param {string} sort - The sort value to validate.
 * @returns {string} The valid sort value.
 */
export function getSortingValue(sort) {
  const validSorts = ['updatedAt', '-updatedAt'];
  if (validSorts.includes(sort)) {
    return sort;
  }
  
  return '-updatedAt';
}