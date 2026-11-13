const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const { pool } = require('../config/db');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('DEPLOY 1.1: Root GET / returns operational status and API index', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.status, 'operational');
  assert.ok(data.endpoints.health);
  assert.ok(data.endpoints.api_health);
});

test('DEPLOY 1.2: GET /health returns service status and safe database check', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.ok(data.database);
  assert.equal(data.database.status, 'connected');
  // Ensure no passwords or credentials leaked in response
  assert.equal(data.database.password, undefined);
  assert.equal(data.database.user, undefined);
});

test('DEPLOY 1.3: GET /api/health returns database connectivity status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.database.status, 'connected');
});

test('DEPLOY 1.4: CORS preflight OPTIONS returns 204 or 200', async () => {
  const res = await fetch(`${baseUrl}/api/public/stats`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://shelfshare-frontend.vercel.app',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert.ok(res.status === 200 || res.status === 204);
  assert.ok(res.headers.get('access-control-allow-origin'));
});
