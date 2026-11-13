const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');

/**
 * Get aggregated real stats for Admin Dashboard
 * GET /api/admin/dashboard
 */
async function getAdminStats(req, res) {
  try {
    const [studentCount] = await pool.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'student'"
    );
    const [activeUsers] = await pool.execute(
      "SELECT COUNT(*) AS total FROM users WHERE account_status = 'active'"
    );
    const [resourceCount] = await pool.execute('SELECT COUNT(*) AS total FROM resources');
    const [downloadCount] = await pool.execute('SELECT COUNT(*) AS total FROM downloads');
    const [reviewCount] = await pool.execute('SELECT COUNT(*) AS total FROM reviews');
    const [pendingReports] = await pool.execute(
      "SELECT COUNT(*) AS total FROM reports WHERE status = 'pending'"
    );

    // Recent admin activity logs
    const [activityLogs] = await pool.execute(`
      SELECT log.*, u.full_name AS admin_name
      FROM admin_activity_logs log
      JOIN users u ON log.admin_id = u.id
      ORDER BY log.created_at DESC
      LIMIT 6
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: studentCount[0].total,
        activeUsers: activeUsers[0].total,
        totalResources: resourceCount[0].total,
        totalDownloads: downloadCount[0].total,
        totalReviews: reviewCount[0].total,
        pendingReports: pendingReports[0].total,
      },
      activityLogs,
    });
  } catch (error) {
    console.error('[Admin Stats Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin stats.' });
  }
}

/**
 * Get aggregated data for Recharts analytics charts
 * GET /api/admin/analytics
 */
async function getAdminAnalytics(req, res) {
  try {
    // 1. Resources uploaded per month (past 6 months)
    const [uploadsByMonth] = await pool.execute(`
      SELECT DATE_FORMAT(created_at, '%b %Y') AS month,
             COUNT(*) AS count
      FROM resources
      GROUP BY DATE_FORMAT(created_at, '%b %Y'), YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
      LIMIT 6
    `);

    // 2. Downloads per month
    const [downloadsByMonth] = await pool.execute(`
      SELECT DATE_FORMAT(downloaded_at, '%b %Y') AS month,
             COUNT(*) AS count
      FROM downloads
      GROUP BY DATE_FORMAT(downloaded_at, '%b %Y'), YEAR(downloaded_at), MONTH(downloaded_at)
      ORDER BY YEAR(downloaded_at) ASC, MONTH(downloaded_at) ASC
      LIMIT 6
    `);

    // 3. Popular subjects by total downloads and resource count
    const [popularSubjects] = await pool.execute(`
      SELECT sub.subject_name AS subject,
             COUNT(r.id) AS resources,
             COALESCE(SUM(r.download_count), 0) AS downloads
      FROM subjects sub
      LEFT JOIN resources r ON sub.id = r.subject_id
      GROUP BY sub.id
      ORDER BY downloads DESC
      LIMIT 6
    `);

    // 4. Resource type distribution
    const [typeDistribution] = await pool.execute(`
      SELECT resource_type AS name, COUNT(*) AS value
      FROM resources
      GROUP BY resource_type
      ORDER BY value DESC
    `);

    // 5. Student registration trends
    const [studentRegistrations] = await pool.execute(`
      SELECT DATE_FORMAT(created_at, '%b %Y') AS month,
             COUNT(*) AS count
      FROM users
      WHERE role = 'student'
      GROUP BY DATE_FORMAT(created_at, '%b %Y'), YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
      LIMIT 6
    `);

    return res.status(200).json({
      success: true,
      analytics: {
        uploadsByMonth,
        downloadsByMonth,
        popularSubjects,
        typeDistribution,
        studentRegistrations,
      },
    });
  } catch (error) {
    console.error('[Admin Analytics Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics data.' });
  }
}

/**
 * Get users list with search & filter
 * GET /api/admin/users
 */
async function getUsers(req, res) {
  try {
    const { q, role, status } = req.query;

    let query = `
      SELECT u.id, u.full_name, u.email, u.college_name, u.role, u.account_status, u.created_at,
             c.course_code, s.semester_number,
             (SELECT COUNT(*) FROM resources WHERE uploader_id = u.id) AS total_uploads,
             (SELECT COUNT(*) FROM downloads WHERE user_id = u.id) AS total_downloads
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN semesters s ON u.semester_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.college_name LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    if (status) {
      query += ' AND u.account_status = ?';
      params.push(status);
    }

    query += ' ORDER BY u.created_at DESC';

    const [users] = await pool.execute(query, params);
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('[Get Users Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

/**
 * Activate or suspend a user account
 * PUT /api/admin/users/:id/status
 */
async function updateUserStatus(req, res) {
  try {
    const targetUserId = req.params.id;
    const adminId = req.user.id;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid account status specified.' });
    }

    // Prevent admin from deactivating themselves
    if (parseInt(targetUserId, 10) === adminId) {
      return res.status(400).json({ success: false, message: 'You cannot alter your own admin status.' });
    }

    await pool.execute('UPDATE users SET account_status = ? WHERE id = ?', [status, targetUserId]);

    // Log admin action
    await pool.execute(
      'INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'UPDATE_USER_STATUS', 'user', targetUserId, `Account status changed to: ${status}`]
    );

    return res.status(200).json({
      success: true,
      message: `User account status updated to ${status}.`,
    });
  } catch (error) {
    console.error('[Update User Status Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
}

/**
 * Get all resources for admin review
 * GET /api/admin/resources
 */
async function getAllResources(req, res) {
  try {
    const { status, q } = req.query;

    let query = `
      SELECT r.*, c.course_code, s.semester_number, sub.subject_name,
             u.full_name AS uploader_name, u.email AS uploader_email
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN users u ON r.uploader_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.moderation_status = ?';
      params.push(status);
    }

    if (q) {
      query += ' AND (r.title LIKE ? OR sub.subject_name LIKE ? OR u.full_name LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY r.created_at DESC';

    const [resources] = await pool.execute(query, params);
    return res.status(200).json({ success: true, resources });
  } catch (error) {
    console.error('[Admin Resources Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resources.' });
  }
}

/**
 * Update resource moderation status (approved, hidden, rejected)
 * PUT /api/admin/resources/:id/moderation
 */
async function updateResourceModeration(req, res) {
  try {
    const resourceId = req.params.id;
    const adminId = req.user.id;
    const { moderation_status, reason } = req.body;

    if (!['approved', 'pending', 'hidden', 'rejected'].includes(moderation_status)) {
      return res.status(400).json({ success: false, message: 'Invalid moderation status.' });
    }

    const [resRows] = await pool.execute('SELECT * FROM resources WHERE id = ?', [resourceId]);
    if (resRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const resource = resRows[0];

    await pool.execute('UPDATE resources SET moderation_status = ? WHERE id = ?', [
      moderation_status,
      resourceId,
    ]);

    // Send in-app notification to the uploader
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Resource Moderation Update', ?, 'resource_moderated', ?)`,
      [
        resource.uploader_id,
        `Your study material "${resource.title}" status has been updated to "${moderation_status}". ${reason ? `Note: ${reason}` : ''}`,
        `/resources/${resourceId}`,
      ]
    );

    // Log admin action
    await pool.execute(
      'INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        adminId,
        'MODERATE_RESOURCE',
        'resource',
        resourceId,
        `Resource status updated to ${moderation_status}. Reason: ${reason || 'Admin review'}`,
      ]
    );

    return res.status(200).json({
      success: true,
      message: `Resource moderation status updated to ${moderation_status}.`,
    });
  } catch (error) {
    console.error('[Moderate Resource Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to moderate resource.' });
  }
}

/**
 * Permanently delete resource by administrator
 * DELETE /api/admin/resources/:id
 */
async function adminDeleteResource(req, res) {
  try {
    const resourceId = req.params.id;
    const adminId = req.user.id;

    const [rows] = await pool.execute('SELECT * FROM resources WHERE id = ?', [resourceId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const resource = rows[0];

    // Safely remove file on disk if not a shared demo file
    if (resource.stored_file_name && !resource.stored_file_name.startsWith('sample-')) {
      const diskPath = path.join(uploadsDir, resource.stored_file_name);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {}
      }
    }

    await pool.execute('DELETE FROM resources WHERE id = ?', [resourceId]);

    // Log admin action
    await pool.execute(
      'INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'DELETE_RESOURCE', 'resource', resourceId, `Deleted resource "${resource.title}"`]
    );

    return res.status(200).json({
      success: true,
      message: 'Resource permanently deleted by administrator.',
    });
  } catch (error) {
    console.error('[Admin Delete Resource Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to delete resource.' });
  }
}

/**
 * Subject Management: Create
 * POST /api/admin/subjects
 */
async function createSubject(req, res) {
  try {
    const adminId = req.user.id;
    const { course_id, semester_id, subject_name, subject_code, description } = req.body;

    if (!course_id || !semester_id || !subject_name || !subject_code) {
      return res.status(400).json({ success: false, message: 'All subject fields are required.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO subjects (course_id, semester_id, subject_name, subject_code, description) VALUES (?, ?, ?, ?, ?)',
      [course_id, semester_id, subject_name.trim(), subject_code.trim().toUpperCase(), description || null]
    );

    await pool.execute(
      'INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'CREATE_SUBJECT', 'subject', result.insertId, `Added subject "${subject_name}" (${subject_code})`]
    );

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully!',
    });
  } catch (error) {
    console.error('[Create Subject Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to create subject.' });
  }
}

/**
 * Subject Management: Update
 * PUT /api/admin/subjects/:id
 */
async function updateSubject(req, res) {
  try {
    const subjectId = req.params.id;
    const adminId = req.user.id;
    const { subject_name, subject_code, description } = req.body;

    await pool.execute(
      'UPDATE subjects SET subject_name = ?, subject_code = ?, description = ? WHERE id = ?',
      [subject_name.trim(), subject_code.trim().toUpperCase(), description || null, subjectId]
    );

    await pool.execute(
      'INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'UPDATE_SUBJECT', 'subject', subjectId, `Updated subject details for ID: ${subjectId}`]
    );

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully.',
    });
  } catch (error) {
    console.error('[Update Subject Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to update subject.' });
  }
}

/**
 * Subject Management: Delete
 * DELETE /api/admin/subjects/:id
 */
async function deleteSubject(req, res) {
  try {
    const subjectId = req.params.id;
    const adminId = req.user.id;

    // Safety check: verify no resources depend on this subject
    const [dep] = await pool.execute('SELECT COUNT(*) AS total FROM resources WHERE subject_id = ?', [
      subjectId,
    ]);
    if (dep[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject because ${dep[0].total} academic resource(s) are linked to it.`,
      });
    }

    await pool.execute('DELETE FROM subjects WHERE id = ?', [subjectId]);

    await pool.execute(
      'INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'DELETE_SUBJECT', 'subject', subjectId, `Deleted subject ID: ${subjectId}`]
    );

    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Subject Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to delete subject.' });
  }
}

/**
 * Get all subjects with resource count for Admin Subject Management
 * GET /api/admin/subjects
 */
async function getSubjects(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT sub.id, sub.subject_name AS name, sub.subject_code AS code, sub.description,
             sub.course_id, sub.semester_id, c.course_code, c.course_name, s.semester_number,
             (SELECT COUNT(*) FROM resources r WHERE r.subject_id = sub.id) AS resource_count
      FROM subjects sub
      JOIN courses c ON sub.course_id = c.id
      JOIN semesters s ON sub.semester_id = s.id
      ORDER BY c.course_code ASC, s.semester_number ASC, sub.subject_code ASC
    `);

    return res.status(200).json({
      success: true,
      data: rows,
      subjects: rows
    });
  } catch (error) {
    console.error('[Admin Get Subjects Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve subjects.' });
  }
}

module.exports = {
  getAdminStats,
  getAdminAnalytics,
  getUsers,
  updateUserStatus,
  getAllResources,
  updateResourceModeration,
  adminDeleteResource,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
