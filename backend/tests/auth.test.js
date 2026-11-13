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

test('POST /api/auth/login - valid student credentials returns JWT and user', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      password: 'Student@123',
    }),
  });

  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.user.email, 'aarav@shelfshare.edu');
  assert.equal(data.user.role, 'student');
  assert.equal(data.user.password_hash, undefined);
});

test('POST /api/auth/login - wrong password returns 401', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      password: 'WrongPassword!',
    }),
  });

  const data = await response.json();
  assert.equal(response.status, 401);
  assert.equal(data.success, false);
});

test('POST /api/auth/login - admin credentials login successfully', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@shelfshare.edu',
      password: 'Admin@123',
    }),
  });

  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.user.role, 'admin');
});

test('GET /api/auth/me - returns user info with valid token', async () => {
  // First login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      password: 'Student@123',
    }),
  });
  const loginData = await loginRes.json();

  // Test /me with Bearer token
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const meData = await meRes.json();
  assert.equal(meRes.status, 200);
  assert.equal(meData.user.email, 'aarav@shelfshare.edu');
  assert.equal(meData.user.role, 'student');
});

test('POST /api/auth/register - prevents duplicate email', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Duplicate Test',
      email: 'aarav@shelfshare.edu',
      password: 'Password123!',
      confirm_password: 'Password123!',
      college_name: 'Test College',
      course_id: 1,
      semester_id: 1,
    }),
  });

  const data = await response.json();
  assert.equal(response.status, 409);
  assert.equal(data.success, false);
});

test('POST /api/auth/register - registers new student successfully', async () => {
  const uniqueEmail = `student_${Date.now()}@shelfshare.edu`;
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Test Junior Student',
      email: uniqueEmail,
      password: 'Student@123',
      confirm_password: 'Student@123',
      college_name: 'Government Engineering College',
      course_id: 1,
      semester_id: 1,
    }),
  });

  const data = await response.json();
  assert.equal(response.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.user.email, uniqueEmail);
  assert.equal(data.user.role, 'student');
});

test('POST /api/auth/forgot-password & reset flow', async () => {
  const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav@shelfshare.edu' }),
  });
  const forgotData = await forgotRes.json();
  assert.equal(forgotRes.status, 200);
  assert.ok(forgotData.demo_reset_code);

  const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      reset_code: forgotData.demo_reset_code,
      new_password: 'NewPassword123!',
      confirm_password: 'NewPassword123!',
    }),
  });
  const resetData = await resetRes.json();
  assert.equal(resetRes.status, 200);
  assert.equal(resetData.success, true);

  // Restore password back to Student@123 for demo consistency
  const resetBackRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav@shelfshare.edu' }),
  });
  const resetBackData = await resetBackRes.json();
  await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      reset_code: resetBackData.demo_reset_code,
      new_password: 'Student@123',
      confirm_password: 'Student@123',
    }),
  });
});
