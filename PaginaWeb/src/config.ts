/**
 * Application configuration.
 * All environment-dependent values should be defined here.
 */

/**
 * Base URL for the backend API.
 * - In Electron (file:// protocol): uses localhost:3001 since the page is loaded from disk.
 * - In browser (http/https via tunnel): uses relative URLs so API calls
 *   go to the same host that served the page (e.g. https://xyz.tunnelmole.net/api/...).
 */
const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:';
export const API_BASE_URL = isElectron
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  : '';
