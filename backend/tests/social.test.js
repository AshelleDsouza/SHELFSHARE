const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const { pool } = require('../config/db');

let server;
let baseUrl;
let studentToken;
let testCollectionId;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login as Aarav Sharma (user id 2)
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

test('POST /api/bookmarks/:resourceId - adds bookmark for student', async () => {
  const res = await fetch(`${baseUrl}/api/bookmarks/3`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.success, true);
});

test('GET /api/bookmarks - retrieves all student bookmarks', async () => {
  const res = await fetch(`${baseUrl}/api/bookmarks`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.bookmarks));
  assert.ok(data.bookmarks.some((b) => b.id === 3));
});

test('DELETE /api/bookmarks/:resourceId - removes bookmark', async () => {
  const res = await fetch(`${baseUrl}/api/bookmarks/3`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
});

test('POST /api/resources/:id/reviews - submits review and updates average rating in MySQL', async () => {
  const res = await fetch(`${baseUrl}/api/resources/5/reviews`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Excellent heuristic search notes, really helped with A* algorithm understanding!',
    }),
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);

  // Check that resources table updated average rating
  const [resRows] = await pool.execute('SELECT average_rating, total_reviews FROM resources WHERE id = 5');
  assert.ok(resRows[0].total_reviews > 0);
  assert.ok(resRows[0].average_rating > 0);
});

test('POST /api/collections - creates study collection', async () => {
  const res = await fetch(`${baseUrl}/api/collections`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection_name: 'Unit Test Exam Prep Set',
      description: 'Test collection created for verifying social collections module.',
    }),
  });
  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.success, true);
  assert.ok(data.collection.id);
  testCollectionId = data.collection.id;
});

test('GET /api/collections - returns user collections with counts', async () => {
  const res = await fetch(`${baseUrl}/api/collections`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.collections));
  assert.ok(data.collections.some((c) => c.id === testCollectionId));
});

test('POST /api/collections/:id/resources/:resId - adds resource into collection', async () => {
  const res = await fetch(`${baseUrl}/api/collections/${testCollectionId}/resources/1`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
});

test('GET /api/collections/:id - returns collection details and resources', async () => {
  const res = await fetch(`${baseUrl}/api/collections/${testCollectionId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.collection.id, testCollectionId);
  assert.equal(data.resources.length, 1);
  assert.equal(data.resources[0].id, 1);
});

test('DELETE /api/collections/:id - deletes collection safely', async () => {
  const res = await fetch(`${baseUrl}/api/collections/${testCollectionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);

  // Check it is deleted
  const [rows] = await pool.execute('SELECT id FROM collections WHERE id = ?', [testCollectionId]);
  assert.equal(rows.length, 0);
});
