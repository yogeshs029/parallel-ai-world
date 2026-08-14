/**
 * Unified API URL Configuration
 * Checks localStorage for custom API base, environment variable, or defaults to relative '/api'.
 * Works on local dev, mobile apps, local network IP devices, and live Cloudflare Workers.
 */
export function getApiBaseUrl(): string {
  try {
    const custom = localStorage.getItem('parallel_custom_api_url');
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  } catch (e) {
    // LocalStorage read error
  }

  if (import.meta.env.VITE_API_URL) {
    const clean = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  return '/api';
}

export const API_BASE = getApiBaseUrl();
