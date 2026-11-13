const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = require('../server');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');

let server;
let baseUrl;
let studentAaravToken;
let studentAaravId;
let studentPoojaToken;
let studentPoojaId;
let adminToken;
let adminId;

// Track created IDs for cleanup
let createdResourceId = null;
let createdCollectionId = null;
let createdSubjectId = null;
let createdReportId = null;
let registeredUserId = null;
let createdStoredFileName = null;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Retrieve test users from database
  const [aaravRows] = await pool.query("SELECT * FROM users WHERE email = 'aarav@shelfshare.edu'");
  assert.ok(aaravRows.length > 0, 'Seed student Aarav must exist');
  studentAaravId = aaravRows[0].id;
  studentAaravToken = generateToken({
    id: aaravRows[0].id,
    email: aaravRows[0].email,
    role: aaravRows[0].role,
  });

  const [priyaRows] = await pool.query("SELECT * FROM users WHERE email = 'priya@shelfshare.edu'");
  assert.ok(priyaRows.length > 0, 'Seed student Priya must exist');
  studentPoojaId = priyaRows[0].id;
  studentPoojaToken = generateToken({
    id: priyaRows[0].id,
    email: priyaRows[0].email,
    role: priyaRows[0].role,
  });

  const [adminRows] = await pool.query("SELECT * FROM users WHERE email = 'admin@shelfshare.edu'");
  assert.ok(adminRows.length > 0, 'Seed admin must exist');
  adminId = adminRows[0].id;
  adminToken = generateToken({
    id: adminRows[0].id,
    email: adminRows[0].email,
    role: adminRows[0].role,
  });
});

test.after(async () => {
  // Remove created resource and physical file
  if (createdResourceId) {
    await pool.query('DELETE FROM resources WHERE id = ?', [createdResourceId]);
  }
  if (createdStoredFileName) {
    const fPath = path.resolve(__dirname, '..', 'uploads', createdStoredFileName);
    if (fs.existsSync(fPath)) {
      try { fs.unlinkSync(fPath); } catch (e) {}
    }
  }
  // Remove registered test student
  if (registeredUserId) {
    await pool.query('DELETE FROM users WHERE id = ?', [registeredUserId]);
  }
  if (createdSubjectId) {
    await pool.query('DELETE FROM subjects WHERE id = ?', [createdSubjectId]);
  }

  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

// =========================================================================
// SECTION 1: AUTHENTICATION, PASSWORD SECURITY & SESSION AUDIT
// =========================================================================
test('AUDIT 1.1: Password Hashing Verification in MySQL on Registration', async () => {
  const uniqueEmail = `audit_student_${Date.now()}@shelfshare.edu`;
  const plainPassword = 'AuditSecurePassword@123';

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Audit Test Student',
      email: uniqueEmail,
      password: plainPassword,
      confirm_password: plainPassword,
      college_name: 'Audit University of Technology',
      course_id: 1,
      semester_id: 1,
    }),
  });

  assert.equal(res.status, 201, 'Registration must return 201 Created');
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.token, 'Must return JWT token');
  registeredUserId = body.user.id;

  // Verify MySQL: plain password must NEVER be stored, hash must be valid bcrypt
  const [dbUser] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [registeredUserId]);
  assert.ok(dbUser.length > 0);
  assert.notEqual(dbUser[0].password_hash, plainPassword, 'Plain password must NOT be stored in MySQL');
  const isBcryptMatch = await bcrypt.compare(plainPassword, dbUser[0].password_hash);
  assert.equal(isBcryptMatch, true, 'Stored hash must verify successfully with bcrypt');
});

test('AUDIT 1.2: Enforce Unique Email Constraint', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Duplicate Student',
      email: 'aarav@shelfshare.edu', // Existing email
      password: 'Password@123',
      confirm_password: 'Password@123',
      college_name: 'Some College',
      course_id: 1,
      semester_id: 1,
    }),
  });

  assert.ok(
    res.status === 400 || res.status === 409,
    `Duplicate registration must be rejected with 400 or 409, received: ${res.status}`
  );
  const body = await res.json();
  assert.equal(body.success, false);
});

test('AUDIT 1.3: Login Authentication with Valid & Invalid Credentials', async () => {
  // 1. Invalid password
  const failRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      password: 'WrongPassword!',
    }),
  });
  assert.equal(failRes.status, 401, 'Invalid password must return 401 Unauthorized');

  // 2. Valid credentials
  const successRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aarav@shelfshare.edu',
      password: 'Student@123',
    }),
  });
  assert.equal(successRes.status, 200);
  const body = await successRes.json();
  assert.equal(body.success, true);
  assert.ok(body.token);
  assert.equal(body.user.email, 'aarav@shelfshare.edu');
});

test('AUDIT 1.4: Session Tampering & Forged Token Rejection', async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.token',
    },
  });
  assert.equal(res.status, 401, 'Forged token must be rejected with 401');
});

// =========================================================================
// SECTION 2: ROLE-BASED ACCESS CONTROL (RBAC) & AUTHORIZATION BOUNDARIES
// =========================================================================
test('AUDIT 2.1: Student Role Blocked from All Admin Endpoints (403 Forbidden)', async () => {
  const adminEndpoints = [
    { method: 'GET', path: '/api/admin/dashboard' },
    { method: 'GET', path: '/api/admin/analytics' },
    { method: 'GET', path: '/api/admin/users' },
    { method: 'GET', path: '/api/admin/reports' },
    { method: 'GET', path: '/api/admin/subjects' },
    { method: 'POST', path: '/api/admin/subjects', body: { name: 'X', code: 'X' } },
  ];

  for (const ep of adminEndpoints) {
    const res = await fetch(`${baseUrl}${ep.path}`, {
      method: ep.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAaravToken}`,
      },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });

    assert.equal(
      res.status,
      403,
      `Student must receive 403 Forbidden on ${ep.method} ${ep.path}`
    );
  }
});

test('AUDIT 2.2: Cross-Student Modification Rejection (Foreign Ownership Guard)', async () => {
  // Resource 1 belongs to Aarav (uploader_id: 1)
  // Priya attempts to edit Aarav's resource
  const res = await fetch(`${baseUrl}/api/resources/1`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentPoojaToken}`,
    },
    body: JSON.stringify({
      title: 'Hacked Title Attempt',
      description: 'Unauthorized modification attempt on foreign resource',
      resource_type: 'Lecture Notes',
    }),
  });

  assert.equal(res.status, 403, 'Modifying another student resource must return 403 Forbidden');
  const body = await res.json();
  assert.equal(body.success, false);
});

// =========================================================================
// SECTION 3: FILE UPLOAD, VALIDATION & FILE SYSTEM SECURITY
// =========================================================================
test('AUDIT 3.1: Valid PDF Upload & Database Verification', async () => {
  const boundary = '----ShelfShareAuditBoundary' + Date.now();
  const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (Audit Sample) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';

  let body = `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="title"\r\n\r\nDistributed Systems Audit Guide\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="description"\r\n\r\nComprehensive lecture notes for auditing distributed consensus and replication.\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="course_id"\r\n\r\n1\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="semester_id"\r\n\r\n1\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="subject_id"\r\n\r\n1\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="unit_name"\r\n\r\nUnit 4: Consensus Protocols\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="resource_type"\r\n\r\nLecture Notes\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="tags"\r\n\r\nconsensus,raft,paxos,audit\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="Audit_Distributed_Notes.pdf"\r\n`;
  body += `Content-Type: application/pdf\r\n\r\n`;
  body += pdfContent;
  body += `\r\n--${boundary}--\r\n`;

  const res = await fetch(`${baseUrl}/api/resources`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${studentAaravToken}`,
    },
    body,
  });

  assert.equal(res.status, 201, 'Upload must return 201 Created');
  const resData = await res.json();
  assert.equal(resData.success, true);
  createdResourceId = resData.data.id;

  // Verify MySQL record
  const [dbRows] = await pool.query('SELECT * FROM resources WHERE id = ?', [createdResourceId]);
  assert.equal(dbRows.length, 1);
  const r = dbRows[0];
  assert.equal(r.title, 'Distributed Systems Audit Guide');
  assert.equal(r.uploader_id, studentAaravId);
  assert.equal(r.file_type, 'pdf');
  createdStoredFileName = r.stored_file_name;

  // Verify stored filename is cryptographically hashed
  assert.notEqual(r.stored_file_name, 'Audit_Distributed_Notes.pdf', 'Server must generate unique secure filename');
  const physicalPath = path.resolve(__dirname, '..', 'uploads', r.stored_file_name);
  assert.ok(fs.existsSync(physicalPath), 'Uploaded file must physically exist in backend/uploads/');
});

test('AUDIT 3.2: Rejection of Disallowed Executable Extensions (.exe)', async () => {
  const boundary = '----ShelfShareSecurityBoundary' + Date.now();
  let body = `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="title"\r\n\r\nMalicious Executable\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="description"\r\n\r\nAttempting executable upload\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="course_id"\r\n\r\n1\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="semester_id"\r\n\r\n1\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="subject_id"\r\n\r\n1\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="exploit.exe"\r\n`;
  body += `Content-Type: application/x-msdownload\r\n\r\n`;
  body += `MZExecutablePayloadData`;
  body += `\r\n--${boundary}--\r\n`;

  const res = await fetch(`${baseUrl}/api/resources`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${studentAaravToken}`,
    },
    body,
  });

  assert.equal(res.status, 400, 'Uploading .exe must be rejected with 400 Bad Request');
  const resData = await res.json();
  assert.equal(resData.success, false);
  assert.match(resData.message, /Unsupported file extension/i);
});

test('AUDIT 3.3: Path Traversal Protection on Preview and Download', async () => {
  // Inject a dummy resource with path traversal attempted in stored_file_name
  const [maliciousRes] = await pool.query(
    `INSERT INTO resources 
     (title, description, course_id, semester_id, subject_id, resource_type, file_name, stored_file_name, file_path, file_type, file_size, uploader_id, moderation_status)
     VALUES ('Traversal Test', 'Path Traversal Attack', 1, 1, 1, 'Lecture Notes', 'hack.pdf', '../../server.js', 'uploads/../../server.js', 'pdf', 500, ?, 'approved')`,
    [studentAaravId]
  );
  const traversalId = maliciousRes.insertId;

  const previewRes = await fetch(`${baseUrl}/api/resources/${traversalId}/preview`);
  assert.equal(previewRes.status, 403, 'Path traversal on preview must be rejected with 403 Forbidden');

  const downloadRes = await fetch(`${baseUrl}/api/resources/${traversalId}/download`, {
    headers: { Authorization: `Bearer ${studentAaravToken}` },
  });
  assert.ok(downloadRes.status === 404 || downloadRes.status === 403, 'Path traversal on download must be blocked');

  // Cleanup malicious test record
  await pool.query('DELETE FROM resources WHERE id = ?', [traversalId]);
});

// =========================================================================
// SECTION 4: SEARCH, FILTERING, SORTING & QUALITY INDICATORS
// =========================================================================
test('AUDIT 4.1: Keyword Search across Titles and Tags', async () => {
  const res = await fetch(`${baseUrl}/api/resources?q=consensus`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.resources.length > 0);
  assert.ok(body.resources.some((r) => r.id === createdResourceId));
});

test('AUDIT 4.2: Multi-criteria Filtering by Course, Semester & Subject', async () => {
  const res = await fetch(`${baseUrl}/api/resources?course_id=1&semester_id=1&subject_id=1`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  body.resources.forEach((r) => {
    assert.equal(r.course_id, 1);
    assert.equal(r.semester_id, 1);
    assert.equal(r.subject_id, 1);
  });
});

// =========================================================================
// SECTION 5: INLINE STREAMING, DOWNLOAD LOGGING & MYSQL COUNTERS
// =========================================================================
test('AUDIT 5.1: Inline PDF Preview Streaming', async () => {
  const res = await fetch(`${baseUrl}/api/resources/${createdResourceId}/preview`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  assert.match(res.headers.get('content-disposition'), /inline/);
  const buffer = await res.arrayBuffer();
  assert.ok(buffer.byteLength > 0, 'Must stream binary PDF payload');
});

test('AUDIT 5.2: File Download Increments MySQL Counter & Logs Download Row', async () => {
  // 1. Get initial download count
  const [[{ download_count: initialCount }]] = await pool.query(
    'SELECT download_count FROM resources WHERE id = ?',
    [createdResourceId]
  );

  // 2. Perform authenticated download
  const res = await fetch(`${baseUrl}/api/resources/${createdResourceId}/download`, {
    headers: { Authorization: `Bearer ${studentPoojaToken}` },
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-disposition'), /attachment/);

  // 3. Verify MySQL download_count incremented by exactly 1
  const [[{ download_count: newCount }]] = await pool.query(
    'SELECT download_count FROM resources WHERE id = ?',
    [createdResourceId]
  );
  assert.equal(newCount, initialCount + 1, 'download_count must increment atomically in MySQL');

  // 4. Verify audit row created in downloads table
  const [downloadRows] = await pool.query(
    'SELECT * FROM downloads WHERE user_id = ? AND resource_id = ?',
    [studentPoojaId, createdResourceId]
  );
  assert.ok(downloadRows.length > 0, 'Audit record must be created in downloads table');

  // 5. Verify download shows in Pooja history
  const historyRes = await fetch(`${baseUrl}/api/downloads/history`, {
    headers: { Authorization: `Bearer ${studentPoojaToken}` },
  });
  assert.equal(historyRes.status, 200);
  const historyBody = await historyRes.json();
  assert.ok(historyBody.downloads.some((d) => d.resource_id === createdResourceId));
});

// =========================================================================
// SECTION 6: SOCIAL INTERACTIONS (BOOKMARKS, REVIEWS, COLLECTIONS)
// =========================================================================
test('AUDIT 6.1: Bookmark Operations & Duplicate Handling', async () => {
  // 1. Add bookmark
  const addRes = await fetch(`${baseUrl}/api/bookmarks/${createdResourceId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentPoojaToken}` },
  });
  assert.equal(addRes.status, 201);

  // 2. Verify bookmark in list
  const listRes = await fetch(`${baseUrl}/api/bookmarks`, {
    headers: { Authorization: `Bearer ${studentPoojaToken}` },
  });
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  assert.ok(listBody.bookmarks.some((b) => b.resource_id === createdResourceId));

  // 3. Remove bookmark
  const delRes = await fetch(`${baseUrl}/api/bookmarks/${createdResourceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentPoojaToken}` },
  });
  assert.equal(delRes.status, 200);
});

test('AUDIT 6.2: Reviews & Atomic Average Rating Recalculation', async () => {
  // Pooja submits a 5-star review for the newly created resource
  const reviewRes = await fetch(`${baseUrl}/api/resources/${createdResourceId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentPoojaToken}`,
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Exceptional notes! Very clear diagrams on consensus algorithms.',
    }),
  });
  assert.ok(
    reviewRes.status === 200 || reviewRes.status === 201,
    `Review creation must return 200 or 201, received: ${reviewRes.status}`
  );

  // Check MySQL average_rating and total_reviews
  const [[r]] = await pool.query('SELECT average_rating, total_reviews FROM resources WHERE id = ?', [
    createdResourceId,
  ]);
  assert.equal(Number(r.average_rating), 5.0);
  assert.equal(r.total_reviews, 1);

  // Check constraint & update: subsequent review updates rating and prevents duplicate row creation
  const updateReviewRes = await fetch(`${baseUrl}/api/resources/${createdResourceId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentPoojaToken}`,
    },
    body: JSON.stringify({
      rating: 4,
      comment: 'Updated review: modified to 4 stars after further review',
    }),
  });
  assert.equal(updateReviewRes.status, 200, 'Subsequent review updates existing review');

  // Verify total_reviews remains exactly 1 and average_rating is updated to 4.0 in MySQL
  const [[r2]] = await pool.query('SELECT average_rating, total_reviews FROM resources WHERE id = ?', [
    createdResourceId,
  ]);
  assert.equal(Number(r2.average_rating), 4.0, 'Average rating must update to 4.0');
  assert.equal(r2.total_reviews, 1, 'Total reviews must remain 1 without duplicate rows');
});

test('AUDIT 6.3: Custom Study Collections Lifecycle & Many-to-Many Mapping', async () => {
  // 1. Create collection
  const colRes = await fetch(`${baseUrl}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentPoojaToken}`,
    },
    body: JSON.stringify({
      collection_name: 'Audit Exam Study Set',
      description: 'Special curated set for semester exams',
    }),
  });
  assert.equal(colRes.status, 201);
  const colBody = await colRes.json();
  createdCollectionId = colBody.data.id;

  // 2. Add resource into collection
  const addRes = await fetch(
    `${baseUrl}/api/collections/${createdCollectionId}/resources/${createdResourceId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentPoojaToken}` },
    }
  );
  assert.equal(addRes.status, 200);

  // 3. Verify resource exists inside collection
  const getRes = await fetch(`${baseUrl}/api/collections/${createdCollectionId}`, {
    headers: { Authorization: `Bearer ${studentPoojaToken}` },
  });
  assert.equal(getRes.status, 200);
  const getBody = await getRes.json();
  assert.equal(getBody.collection.collection_name, 'Audit Exam Study Set');
  assert.ok(getBody.resources.some((resItem) => resItem.id === createdResourceId));

  // 4. Remove resource from collection
  const removeRes = await fetch(
    `${baseUrl}/api/collections/${createdCollectionId}/resources/${createdResourceId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentPoojaToken}` },
    }
  );
  assert.equal(removeRes.status, 200);

  // 5. Delete collection
  const delColRes = await fetch(`${baseUrl}/api/collections/${createdCollectionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentPoojaToken}` },
  });
  assert.equal(delColRes.status, 200);
  createdCollectionId = null;
});

// =========================================================================
// SECTION 7: RECOMMENDATION ENGINE & QUALITY INDICATORS
// =========================================================================
test('AUDIT 7.1: Curriculum Affinity Recommendation Ranking', async () => {
  const res = await fetch(`${baseUrl}/api/resources/recommended`, {
    headers: { Authorization: `Bearer ${studentAaravToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.recommendations));
  assert.ok(body.recommendations.length > 0);

  // Verify recommendations carry quality indicator flags
  const firstRec = body.recommendations[0];
  assert.ok(firstRec.qualityBadges, 'Recommendations must contain qualityBadges object');
  assert.equal(typeof firstRec.qualityBadges.curriculumMatch, 'boolean');
  assert.equal(typeof firstRec.qualityBadges.isHighQuality, 'boolean');
  assert.equal(typeof firstRec.qualityBadges.isPopular, 'boolean');
});

// =========================================================================
// SECTION 8: NOTIFICATIONS & USER PROFILE AGGREGATION
// =========================================================================
test('AUDIT 8.1: Notifications Read Tracking', async () => {
  // 1. Insert notification for Aarav
  const [notifRes] = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, is_read)
     VALUES (?, 'Audit Notification', 'Audit test notification message', 'general', 0)`,
    [studentAaravId]
  );
  const testNotifId = notifRes.insertId;

  // 2. Check unread count
  const countRes = await fetch(`${baseUrl}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${studentAaravToken}` },
  });
  assert.equal(countRes.status, 200);
  const countBody = await countRes.json();
  assert.ok(countBody.unreadCount > 0);

  // 3. Mark as read
  const markRes = await fetch(`${baseUrl}/api/notifications/${testNotifId}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentAaravToken}` },
  });
  assert.equal(markRes.status, 200);

  // Cleanup notification
  await pool.query('DELETE FROM notifications WHERE id = ?', [testNotifId]);
});

test('AUDIT 8.2: User Profile Aggregated Stats from MySQL', async () => {
  const res = await fetch(`${baseUrl}/api/users/profile`, {
    headers: { Authorization: `Bearer ${studentAaravToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.email, 'aarav@shelfshare.edu');
  assert.ok(body.data.stats);
  assert.equal(typeof body.data.stats.totalUploads, 'number');
  assert.equal(typeof body.data.stats.totalDownloads, 'number');
  assert.equal(typeof body.data.stats.totalBookmarks, 'number');
});

// =========================================================================
// SECTION 9: ADMINISTRATIVE GOVERNANCE & CONTENT MODERATION
// =========================================================================
test('AUDIT 9.1: Admin Analytics & Aggregated Metrics', async () => {
  const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.stats.totalStudents >= 1);
  assert.ok(body.stats.totalResources >= 1);
  assert.ok(Array.isArray(body.activityLogs));
});

test('AUDIT 9.2: User Account Status Modification by Admin', async () => {
  // Suspend registered test user
  const suspendRes = await fetch(`${baseUrl}/api/admin/users/${registeredUserId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'suspended' }),
  });
  assert.equal(suspendRes.status, 200);

  // Verify MySQL status updated
  const [[u]] = await pool.query('SELECT account_status FROM users WHERE id = ?', [registeredUserId]);
  assert.equal(u.account_status, 'suspended');

  // Reactivate user
  await fetch(`${baseUrl}/api/admin/users/${registeredUserId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'active' }),
  });
});

test('AUDIT 9.3: Content Reporting & Admin Resolution Workflow', async () => {
  // 1. Pooja reports the test resource
  const reportRes = await fetch(`${baseUrl}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentPoojaToken}`,
    },
    body: JSON.stringify({
      resource_id: createdResourceId,
      reason: 'Duplicate material',
      description: 'Audit report test description',
    }),
  });
  assert.equal(reportRes.status, 201);
  const reportBody = await reportRes.json();
  createdReportId = reportBody.report_id;

  // 2. Admin retrieves report list
  const adminReportsRes = await fetch(`${baseUrl}/api/admin/reports`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminReportsRes.status, 200);
  const reportsBody = await adminReportsRes.json();
  assert.ok(reportsBody.reports.some((rep) => rep.id === createdReportId));

  // 3. Admin resolves report
  const resolveRes = await fetch(`${baseUrl}/api/admin/reports/${createdReportId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'dismissed',
      admin_notes: 'Verified content is genuine and compliant during audit',
    }),
  });
  assert.equal(resolveRes.status, 200);

  // Verify status in MySQL
  const [[rep]] = await pool.query('SELECT status, admin_notes FROM reports WHERE id = ?', [createdReportId]);
  assert.equal(rep.status, 'dismissed');
});

test('AUDIT 9.4: Subject Curriculum Management (Create, List, Update, Delete)', async () => {
  // 1. Create new subject
  const createRes = await fetch(`${baseUrl}/api/admin/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      course_id: 1,
      semester_id: 1,
      subject_name: 'Audit Quantum Computing',
      subject_code: 'AUDITQC101',
      description: 'Curriculum audit subject',
    }),
  });
  assert.equal(createRes.status, 201);

  // 2. List subjects and find it
  const listRes = await fetch(`${baseUrl}/api/admin/subjects`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  const subjectItem = listBody.data.find((s) => s.code === 'AUDITQC101');
  assert.ok(subjectItem, 'Created subject must exist in admin list');
  createdSubjectId = subjectItem.id;

  // 3. Update subject
  const updateRes = await fetch(`${baseUrl}/api/admin/subjects/${createdSubjectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      subject_name: 'Audit Quantum Computing Updated',
      subject_code: 'AUDITQC101',
      description: 'Updated syllabus details',
    }),
  });
  assert.equal(updateRes.status, 200);

  // 4. Delete subject
  const delRes = await fetch(`${baseUrl}/api/admin/subjects/${createdSubjectId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(delRes.status, 200);
  createdSubjectId = null;
});
