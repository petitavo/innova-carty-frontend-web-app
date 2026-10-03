// Fake REST API for Sprint 1 (json-server). Exposes the resources under /api/v1,
// the same prefix the real Spring Boot services will use.
const jsonServer = require('json-server');

/**
 * @param {string | object} source path to db.json (data is saved to the file) or an in-memory object
 */
function createApi(source) {
  const server = jsonServer.create();
  const router = jsonServer.router(source);

  server.use(jsonServer.defaults({ logger: process.env.NODE_ENV !== 'production' }));
  server.use(jsonServer.bodyParser);

  // Sign-in returns the user without secrets plus a demo token.
  server.post('/api/v1/authentication/sign-in', (req, res) => {
    const { email, password } = req.body || {};
    const user = router.db.get('users').find({ email: String(email || '').toLowerCase() }).value();
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const { password: _p, supervisorPin: _pin, ...profile } = user;
    res.json({ ...profile, token: `demo-token-${user.id}` });
  });

  // Unlocking a cart checks the supervisor PIN before the console patches the cart.
  server.post('/api/v1/authentication/verify-pin', (req, res) => {
    const { userId, pin } = req.body || {};
    const user = router.db.get('users').find({ id: Number(userId) }).value();
    res.status(user && user.supervisorPin === pin ? 204 : 403).end();
  });

  server.use(jsonServer.rewriter({ '/api/v1/*': '/$1' }));
  server.use(router);
  return server;
}

module.exports = { createApi };
