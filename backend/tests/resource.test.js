const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const { pool } = require('../config/db');

let server;
let baseUrl;
let studentToken;
let otherStudentToken;
let createdResourceId;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login as Aarav Sharma (student id 2)
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav@shelfshare.edu', password: 'Student@123' }),
  });
  const loginData = await loginRes.json();
  studentToken = loginData.token;

  // Login as Priya Patel (student id 3)
  const otherLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya@shelfshare.edu', password: 'Student@123' }),
  });
  const otherLoginData = await otherLoginRes.json();
  otherStudentToken = otherLoginData.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('POST /api/resources - rejects unauthenticated request with 401', async () => {
  const res = await fetch(`${baseUrl}/api/resources`, { method: 'POST' });
  assert.equal(res.status, 401);
});

test('POST /api/resources - successfully uploads a document and inserts into MySQL', async () => {
  const formData = new FormData();
  formData.append('title', 'Automated Test: AVL Tree Quick Reference');
  formData.append('description', 'Step by step rotation notes generated automatically during system tests.');
  formData.append('course_id', '1');
  formData.append('semester_id', '1');
  formData.append('subject_id', '1'); // MCA101: DSA
  formData.append('unit_name', 'Unit 3: Balanced Trees');
  formData.append('resource_type', 'Lecture Notes');
  formData.append('tags', 'test,dsa,avl');

  // Create a genuine small test PDF file
  const testPdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF';
  const blob = new Blob([testPdfContent], { type: 'application/pdf' });
  formData.append('file', blob, 'avl_tree_test.pdf');

  const res = await fetch(`${baseUrl}/api/resources`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: formData,
  });

  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.success, true);
  assert.ok(data.resource.id);
  assert.equal(data.resource.title, 'Automated Test: AVL Tree Quick Reference');
  assert.equal(data.resource.course_code, 'MCA');

  createdResourceId = data.resource.id;
});

test('GET /api/resources/my-uploads - lists uploaded resources for current student', async () => {
  const res = await fetch(`${baseUrl}/api/resources/my-uploads`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.resources));
  const found = data.resources.find((r) => r.id === createdResourceId);
  assert.ok(found);
  assert.equal(found.title, 'Automated Test: AVL Tree Quick Reference');
});

test('PUT /api/resources/:id - allows owner to update metadata', async () => {
  const res = await fetch(`${baseUrl}/api/resources/${createdResourceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Automated Test: AVL Tree Rotations (Updated)',
      description: 'Updated comprehensive description for testing edit module.',
      resource_type: 'Handwritten Notes',
      unit_name: 'Unit 3: Rotations',
      tags: 'updated,avl',
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.resource.title, 'Automated Test: AVL Tree Rotations (Updated)');
  assert.equal(data.resource.resource_type, 'Handwritten Notes');
});

test('PUT /api/resources/:id - prevents non-owner from modifying another student resource', async () => {
  const res = await fetch(`${baseUrl}/api/resources/${createdResourceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${otherStudentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Malicious modification attempt',
      description: 'Should be rejected by authorization middleware.',
      resource_type: 'Other',
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 403);
  assert.equal(data.success, false);
});

test('DELETE /api/resources/:id - allows owner to safely delete their resource', async () => {
  const res = await fetch(`${baseUrl}/api/resources/${createdResourceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);

  // Verify DB record is gone
  const [rows] = await pool.execute('SELECT id FROM resources WHERE id = ?', [createdResourceId]);
  assert.equal(rows.length, 0);
});
