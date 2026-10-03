// Local fake API: npm run api  ->  http://localhost:3000/api/v1
// Changes are saved to server/db.local.json (git-ignored) so db.json stays as the seed.
// Delete db.local.json (or run npm run api:reset) to start again from the seed.
const fs = require('fs');
const path = require('path');
const { createApi } = require('./app');

const seed = path.join(__dirname, 'db.json');
const local = path.join(__dirname, 'db.local.json');
if (process.argv.includes('--reset') || !fs.existsSync(local)) fs.copyFileSync(seed, local);

const port = Number(process.env.API_PORT) || 3000;
createApi(local).listen(port, () => {
  console.log(`Innova Carty fake API running at http://localhost:${port}/api/v1`);
});
