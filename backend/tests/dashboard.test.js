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

  // Login as Aarav Sharma (MCA student)
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      password: 'Student@123',
    }),
  });
  const loginData = await loginRes.json();
  studentToken = loginData.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /api/public/stats - returns real DB counts for landing page', async () => {
  const res = await fetch(`${baseUrl}/api/public/stats`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.stats.totalResources >= 20);
  assert.ok(data.stats.activeStudents >= 10);
  assert.equal(data.stats.totalCourses, 3);
  assert.ok(Array.isArray(data.featuredResources));
});

test('GET /api/academic/courses - returns list of courses', async () => {
  const res = await fetch(`${baseUrl}/api/academic/courses`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.courses.length, 3);
});

test('GET /api/academic/courses/1/semesters - returns MCA semesters', async () => {
  const res = await fetch(`${baseUrl}/api/academic/courses/1/semesters`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.semesters.length, 4);
});

test('GET /api/dashboard/stats - rejects unauthenticated request with 401', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/stats`);
  assert.equal(res.status, 401);
});

test('GET /api/dashboard/stats - returns student stats from MySQL', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(typeof data.stats.totalResourcesAvailable === 'number');
  assert.ok(typeof data.stats.myUploadedResources === 'number');
  assert.ok(typeof data.stats.myDownloads === 'number');
  assert.ok(typeof data.stats.myBookmarks === 'number');
});

test('GET /api/dashboard/overview - returns recommended, popular, and activity feeds', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/overview`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.recentlyUploaded));
  assert.ok(Array.isArray(data.popularResources));
  assert.ok(Array.isArray(data.recommended));
  assert.ok(Array.isArray(data.recentActivity));
  assert.ok(Array.isArray(data.bookmarkedIds));
});
