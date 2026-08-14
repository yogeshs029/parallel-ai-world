/**
 * Unified API URL Configuration
 * In production (Cloudflare Workers / remote devices), returns relative '/api'
 * so requests hit the Worker directly on the same domain without needing localhost.
 * In local development, Vite proxy forwards '/api' requests to the FastAPI backend (port 8000).
 */
export function getApiBaseUrl(): string {
  // If explicitly overridden via environment variable (e.g. Capacitor mobile build)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api';
  }

  // Relative path works universally on Cloudflare Workers and Vite Proxy
  return '/api';
}

export const API_BASE = getApiBaseUrl();
