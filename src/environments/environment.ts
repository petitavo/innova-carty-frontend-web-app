export const environment = {
  production: true,
  // Sprint 1 uses the json-server fake API (proxied locally, Vercel function when deployed).
  apiBaseUrl: '/api/v1',
  // Refresh rate of the live views (US11).
  pollingIntervalMs: 5000,
};
