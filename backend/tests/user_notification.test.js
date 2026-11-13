const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');

test('User and Notification Endpoints Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let studentToken;
  let testUserId;
  let testNotifId;

  // Setup: obtain student token & insert test notification
  const [users] = await pool.query(
    `SELECT id, email, role FROM users WHERE email = 'aarav@shelfshare.edu'`
  );
  assert.ok(users.length > 0, 'Seed student Aarav must exist');
  testUserId = users[0].id;
  studentToken = generateToken({
    id: users[0].id,
    email: users[0].email,
    role: users[0].role
  });

  const [notifResult] = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, is_read) 
     VALUES (?, 'Test Notification', 'Welcome to ShelfShare tests', 'general', 0)`,
    [testUserId]
  );
  testNotifId = notifResult.insertId;

  await t.test('GET /api/users/profile returns detailed profile and stats', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.email, 'aarav@shelfshare.edu');
    assert.ok(body.data.stats, 'Profile must include aggregated stats');
    assert.equal(typeof body.data.stats.totalUploads, 'number');
    assert.equal(typeof body.data.stats.totalBookmarks, 'number');
  });

  await t.test('PUT /api/users/profile updates user college name', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        full_name: 'Aarav Sharma Updated',
        college_name: 'National Institute of Technology'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.full_name, 'Aarav Sharma Updated');
    assert.equal(body.data.college_name, 'National Institute of Technology');

    // Revert full_name back
    await pool.query(
      `UPDATE users SET full_name = 'Aarav Sharma' WHERE id = ?`,
      [testUserId]
    );
  });

  await t.test('GET /api/notifications returns user notifications list and unread count', async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
    assert.equal(typeof body.unread_count, 'number');
  });

  await t.test('PUT /api/notifications/:id/read marks notification as read', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/${testNotifId}/read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const [[notif]] = await pool.query(
      `SELECT is_read FROM notifications WHERE id = ?`,
      [testNotifId]
    );
    assert.equal(notif.is_read, 1);
  });

  await t.test('PUT /api/notifications/mark-all-read marks all as read', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const [[{ unread_count }]] = await pool.query(
      `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [testUserId]
    );
    assert.equal(unread_count, 0);
  });

  // Cleanup test notification
  await pool.query(`DELETE FROM notifications WHERE id = ?`, [testNotifId]);

  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});
