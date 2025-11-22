/**
 * JWT token validation and decoding utilities
 */

/**
 * Decode JWT token without verification (base64 decode)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Extract user information from ID token
 * @param {string} idToken - AWS Cognito ID token
 * @returns {object|null} User information object
 */
export const extractUserInfo = (idToken) => {
  const decoded = decodeToken(idToken);
  if (!decoded) return null;

  return {
    sub: decoded.sub,
    email: decoded.email,
    emailVerified: decoded.email_verified,
    username: decoded['cognito:username'],
    role: decoded['custom:role'],
    hospital: decoded['custom:hospital'],
    departmentId: decoded['custom:departmentId'],
    tokenUse: decoded.token_use,
    issuer: decoded.iss,
    audience: decoded.aud,
    issuedAt: decoded.iat,
    expiresAt: decoded.exp
  };
};

/**
 * Get time remaining until token expires
 * @param {string} token - JWT token
 * @returns {number} Seconds remaining (0 if expired)
 */
export const getTokenTimeRemaining = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  const currentTime = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - currentTime;
  return Math.max(0, remaining);
};

/**
 * Validate token structure (basic checks only, not cryptographic verification)
 * @param {string} token - JWT token
 * @returns {boolean} True if structure is valid
 */
export const isValidTokenStructure = (token) => {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    // Try to decode each part
    atob(parts[0]); // header
    atob(parts[1]); // payload
    // signature part doesn't need to be base64 decodable
    return true;
  } catch {
    return false;
  }
};

/**
 * Format expiration time as human-readable string
 * @param {string} token - JWT token
 * @returns {string} Formatted time remaining
 */
export const formatTokenExpiration = (token) => {
  const seconds = getTokenTimeRemaining(token);

  if (seconds <= 0) return 'Expired';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};
