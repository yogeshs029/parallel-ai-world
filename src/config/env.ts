export const env = {
  appTitle: import.meta.env.VITE_APP_TITLE || 'Parallel AI World',
  shortName: import.meta.env.VITE_APP_SHORT_NAME || 'Parallel',
  version: import.meta.env.VITE_APP_VERSION || '0.1.0-alpha',
  mode: import.meta.env.MODE || 'development',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  enableMockTelemetry: import.meta.env.VITE_ENABLE_MOCK_TELEMETRY === 'true',
  telemetryIntervalMs: Number(import.meta.env.VITE_TELEMETRY_INTERVAL_MS) || 3000,
};
