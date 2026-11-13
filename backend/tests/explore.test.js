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

test('GET /api/resources - returns paginated resources list', async () => {
  const res = await fetch(`${baseUrl}/api/resources?page=1&limit=6`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.resources));
  assert.equal(data.resources.length, 6);
  assert.ok(data.pagination.total >= 20);
  assert.equal(data.pagination.page, 1);
});

test('GET /api/resources?q=binary - searches title and tags', async () => {
  const res = await fetch(`${baseUrl}/api/resources?q=binary`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.resources.length > 0);
  assert.ok(data.resources.some((r) => r.title.toLowerCase().includes('binary')));
});

test('GET /api/resources?course_id=1 - filters by course', async () => {
  const res = await fetch(`${baseUrl}/api/resources?course_id=1`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.resources.every((r) => r.course_id === 1));
});

test('GET /api/resources?sort=most_downloaded - sorts by downloads descending', async () => {
  const res = await fetch(`${baseUrl}/api/resources?sort=most_downloaded&limit=5`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  for (let i = 1; i < data.resources.length; i++) {
    assert.ok(data.resources[i - 1].download_count >= data.resources[i].download_count);
  }
});

test('GET /api/resources/:id - returns single resource with details and reviews', async () => {
  const res = await fetch(`${baseUrl}/api/resources/1`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.resource.id, 1);
  assert.equal(data.resource.course_code, 'MCA');
  assert.ok(Array.isArray(data.reviews));
  assert.ok(Array.isArray(data.relatedResources));
});

test('GET /api/resources/99999 - returns 404 for missing resource', async () => {
  const res = await fetch(`${baseUrl}/api/resources/99999`);
  assert.equal(res.status, 404);
});
