// server.js — AutoPartsPro Backend API
// Zero external dependencies — uses only Node.js built-in modules
// Run: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { verifyToken } = require('./middleware/auth');
const { productsRoutes } = require('./routes/products');
const { authRoutes } = require('./routes/auth');
const { cartRoutes } = require('./routes/cart');
const { ordersRoutes } = require('./routes/orders');
const { reviewsRoutes } = require('./routes/reviews');
const { adminRoutes } = require('./routes/admin');
const { readDB } = require('./db');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// ─── CORS Headers ────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Session-Id');
}

// ─── Response Helpers ────────────────────────────────────────────────────────
function buildRes(res) {
  res.json = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  };
  res.status = (code) => {
    res._status = code;
    return { json: (data) => res.json(data, code) };
  };
  return res;
}

// ─── Parse JSON Body ─────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
  });
}

// ─── Serve Static File ───────────────────────────────────────────────────────
function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon'
  };
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}

// ─── Main Request Handler ─────────────────────────────────────────────────────
const server = http.createServer(async (req, rawRes) => {
  const res = buildRes(rawRes);
  setCORS(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    rawRes.writeHead(204);
    rawRes.end();
    return;
  }

  const baseUrl = `http://localhost:${PORT}`;
  const url = new URL(req.url, baseUrl);
  const method = req.method;

  // ── Serve Frontend ──────────────────────────────────────────────────────────
  if (!url.pathname.startsWith('/api')) {
    let filePath = path.join(FRONTEND_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
    serveStatic(rawRes, filePath);
    return;
  }

  // ── Parse body & token ──────────────────────────────────────────────────────
  const body = await parseBody(req);
  const authHeader = req.headers['authorization'];
  let user = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    user = verifyToken(authHeader.slice(7));
  }

  // ── Health check ────────────────────────────────────────────────────────────
  if (method === 'GET' && url.pathname === '/api/health') {
    return res.json({ status: 'ok', message: 'AutoPartsPro API running', version: '1.0.0', time: new Date().toISOString() });
  }

  // ── GET /api/auth/me ─────────────────────────────────────────────────────────
  if (method === 'GET' && url.pathname === '/api/auth/me') {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const db = readDB();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });
    const { password, ...safeUser } = dbUser;
    return res.json(safeUser);
  }

  // ── Route dispatch ──────────────────────────────────────────────────────────
  let handled = null;

  handled = authRoutes(req, res, url, method, body);
  if (handled !== null) return;

  handled = productsRoutes(req, res, url, method, body, user);
  if (handled !== null) return;

  handled = cartRoutes(req, res, url, method, body, user);
  if (handled !== null) return;

  handled = ordersRoutes(req, res, url, method, body, user);
  if (handled !== null) return;

  handled = reviewsRoutes(req, res, url, method, body, user);
  if (handled !== null) return;

  handled = adminRoutes(req, res, url, method, body, user);
  if (handled !== null) return;

  // 404
  res.json({ error: `Cannot ${method} ${url.pathname}` }, 404);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║     🚗  AutoPartsPro API Server          ║');
  console.log(`  ║     http://localhost:${PORT}               ║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  Routes available:');
  console.log('  GET    /api/health');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/auth/me');
  console.log('  GET    /api/products');
  console.log('  GET    /api/products/:id');
  console.log('  POST   /api/products         (admin)');
  console.log('  PUT    /api/products/:id      (admin)');
  console.log('  DELETE /api/products/:id      (admin)');
  console.log('  GET    /api/products/categories');
  console.log('  GET    /api/cart');
  console.log('  POST   /api/cart');
  console.log('  PUT    /api/cart/:productId');
  console.log('  DELETE /api/cart/:productId');
  console.log('  DELETE /api/cart');
  console.log('  GET    /api/orders');
  console.log('  POST   /api/orders');
  console.log('  GET    /api/orders/:id');
  console.log('  PATCH  /api/orders/:id/status (admin)');
  console.log('  GET    /api/reviews');
  console.log('  POST   /api/reviews');
  console.log('  DELETE /api/reviews/:id');
  console.log('  GET    /api/admin/stats        (admin)');
  console.log('  GET    /api/admin/users         (admin)');
  console.log('');
  console.log('  Admin login: admin@autopartspro.com / admin123');
  console.log('');
});