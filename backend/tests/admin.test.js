const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const { pool } = require('../config/db');

let server;
let baseUrl;
let adminToken;
let studentToken;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login as admin
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shelfshare.edu', password: 'Admin@123' }),
  });
  const adminData = await adminLogin.json();
  adminToken = adminData.token;

  // Login as student (Aarav)
  const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav@shelfshare.edu', password: 'Student@123' }),
  });
  const studentData = await studentLogin.json();
  studentToken = studentData.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /api/admin/dashboard - rejects student with 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.equal(res.status, 403);
});

test('GET /api/admin/dashboard - returns admin stats for authorized administrator', async () => {
  const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.stats.totalStudents >= 10);
  assert.ok(data.stats.totalResources >= 20);
  assert.ok(Array.isArray(data.activityLogs));
});

test('GET /api/admin/analytics - returns real aggregated charts data', async () => {
  const res = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.analytics.uploadsByMonth));
  assert.ok(Array.isArray(data.analytics.downloadsByMonth));
  assert.ok(Array.isArray(data.analytics.popularSubjects));
  assert.ok(Array.isArray(data.analytics.typeDistribution));
});

test('GET /api/admin/users - lists users with activity stats', async () => {
  const res = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.users));
  assert.ok(data.users.length >= 10);
});

test('PUT /api/admin/users/:id/status - updates account status', async () => {
  const res = await fetch(`${baseUrl}/api/admin/users/10/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'active' }),
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
});

test('POST /api/reports - allows student to report content', async () => {
  const res = await fetch(`${baseUrl}/api/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resource_id: 1,
      reason: 'Incorrect content',
      description: 'Minor formula typo in section 2.',
    }),
  });
  const data = await res.json();
  // Status 201 or 409 if already reported
  assert.ok(res.status === 201 || res.status === 409);
});

test('GET /api/admin/reports - lists reports for review', async () => {
  const res = await fetch(`${baseUrl}/api/admin/reports`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.reports));
  assert.ok(data.reports.length > 0);
});
