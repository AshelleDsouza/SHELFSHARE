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

  // Login as Aarav Sharma (MCA Sem 1)
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

test('GET /api/resources/popular - returns popular resources with quality indicators', async () => {
  const res = await fetch(`${baseUrl}/api/resources/popular`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.resources));
  assert.ok(data.resources.length > 0);
  assert.ok(data.resources[0].quality);
  assert.ok(data.resources[0].quality.label);
});

test('GET /api/resources/recommended - rejects unauthenticated request with 401', async () => {
  const res = await fetch(`${baseUrl}/api/resources/recommended`);
  assert.equal(res.status, 401);
});

test('GET /api/resources/recommended - returns ranked curriculum recommendations for student', async () => {
  const res = await fetch(`${baseUrl}/api/resources/recommended`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.recommendations));
  assert.ok(data.recommendations.length > 0);
  assert.ok(data.algorithm.includes('Weighted multi-factor'));

  // The top recommendation should have a positive calculated recommendation_score
  assert.ok(data.recommendations[0].recommendation_score > 0);
  assert.ok(data.recommendations[0].quality.label);
});
