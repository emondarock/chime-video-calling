/**
 * URL query parameter utilities
 */

/**
 * Get a specific query parameter from the URL
 * @param {string} param - The parameter name to retrieve
 * @returns {string|null} The parameter value or null if not found
 */
export const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

/**
 * Get all query parameters as an object
 * @returns {Object} Object containing all query parameters
 */
export const getAllQueryParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {};

  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }

  return params;
};

/**
 * Update a query parameter in the URL without page reload
 * @param {string} param - The parameter name
 * @param {string} value - The parameter value
 */
export const setQueryParam = (param, value) => {
  const url = new URL(window.location.href);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
};

/**
 * Remove a query parameter from the URL without page reload
 * @param {string} param - The parameter name to remove
 */
export const removeQueryParam = (param) => {
  const url = new URL(window.location.href);
  url.searchParams.delete(param);
  window.history.pushState({}, '', url);
};

/**
 * Parse token from URL (convenience method for join-meeting flow)
 * @returns {string|null} The meeting token or null
 */
export const getMeetingTokenFromUrl = () => {
  return getQueryParam('token');
};
