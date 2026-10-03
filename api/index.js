// Vercel serverless function that serves the fake API in the deployed Web App.
// Data lives in memory, so changes reset when the function cold-starts.
const { createApi } = require('../server/app');
const seed = require('../server/db.json');

const api = createApi(JSON.parse(JSON.stringify(seed)));

module.exports = (req, res) => {
  // vercel.json rewrites /api/v1/<path> to /api?path=<path>; restore the original URL.
  const url = new URL(req.url, 'http://localhost');
  const forwarded = url.searchParams.get('path');
  if (forwarded !== null && !url.pathname.startsWith('/api/v1/')) {
    url.searchParams.delete('path');
    const query = url.searchParams.toString();
    req.url = `/api/v1/${forwarded}${query ? `?${query}` : ''}`;
  }
  return api(req, res);
};
