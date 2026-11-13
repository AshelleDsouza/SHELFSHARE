const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const { pool } = require('../config/db');

let server;
let baseUrl;
let studentToken;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login as Aarav Sharma
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav@shelfshare.edu', password: 'Student@123' }),
  });
  const loginData = await loginRes.json();
  studentToken = loginData.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /api/resources/1/preview - streams PDF inline', async () => {
  const res = await fetch(`${baseUrl}/api/resources/1/preview`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  assert.ok(res.headers.get('content-disposition').includes('inline'));
  const blob = await res.blob();
  assert.ok(blob.size > 0);
});

test('GET /api/resources/99999/preview - returns 404', async () => {
  const res = await fetch(`${baseUrl}/api/resources/99999/preview`);
  assert.equal(res.status, 404);
});

test('GET /api/resources/1/download - rejects unauthenticated request with 401', async () => {
  const res = await fetch(`${baseUrl}/api/resources/1/download`);
  assert.equal(res.status, 401);
});

test('GET /api/resources/1/download - authenticated download increments count and records log', async () => {
  // Check initial download count
  const [initial] = await pool.execute('SELECT download_count FROM resources WHERE id = 1');
  const countBefore = initial[0].download_count;

  const res = await fetch(`${baseUrl}/api/resources/1/download`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-disposition').includes('attachment'));

  // Check download count increased by 1
  const [after] = await pool.execute('SELECT download_count FROM resources WHERE id = 1');
  assert.equal(after[0].download_count, countBefore + 1);

  // Check downloads table record exists
  const [dlRows] = await pool.execute(
    'SELECT * FROM downloads WHERE user_id = 2 AND resource_id = 1 ORDER BY downloaded_at DESC LIMIT 1'
  );
  assert.ok(dlRows.length > 0);
});

test('GET /api/downloads/history - returns authenticated student download history', async () => {
  const res = await fetch(`${baseUrl}/api/downloads/history`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.downloads));
  assert.ok(data.downloads.length > 0);
  assert.equal(data.downloads[0].resource_id, 1);
});
