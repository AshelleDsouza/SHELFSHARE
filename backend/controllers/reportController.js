const { pool } = require('../config/db');

/**
 * Submit a report for a resource
 * POST /api/reports
 */
async function createReport(req, res) {
  try {
    const reporterId = req.user.id;
    const { resource_id, reason, description } = req.body;

    if (!resource_id || !reason) {
      return res.status(400).json({ success: false, message: 'Resource ID and reason are required.' });
    }

    // Check if already reported with pending status
    const [existing] = await pool.execute(
      'SELECT id FROM reports WHERE reporter_id = ? AND resource_id = ? AND status = ?',
      [reporterId, resource_id, 'pending']
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a pending report for this study material.',
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO reports (reporter_id, resource_id, reason, description, status) VALUES (?, ?, ?, ?, ?)',
      [reporterId, resource_id, reason, description || null, 'pending']
    );

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Administrators have been notified.',
      reportId: result.insertId,
      report_id: result.insertId,
    });
  } catch (error) {
    console.error('[Create Report Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
}

/**
 * Get reports list for administrators
 * GET /api/admin/reports
 */
async function getAdminReports(req, res) {
  try {
    const [reports] = await pool.execute(`
      SELECT rep.*, 
             r.title AS resource_title, r.moderation_status AS resource_status,
             reporter.full_name AS reporter_name, reporter.email AS reporter_email,
             uploader.id AS uploader_id, uploader.full_name AS uploader_name, uploader.email AS uploader_email
      FROM reports rep
      JOIN resources r ON rep.resource_id = r.id
      JOIN users reporter ON rep.reporter_id = reporter.id
      JOIN users uploader ON r.uploader_id = uploader.id
      ORDER BY 
        CASE WHEN rep.status = 'pending' THEN 1 ELSE 2 END,
        rep.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('[Get Admin Reports Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
}

/**
 * Update report status (dismiss or action_taken)
 * PUT /api/admin/reports/:id
 */
async function updateReportStatus(req, res) {
  try {
    const reportId = req.params.id;
    const adminId = req.user.id;
    const { status, admin_notes, hide_resource } = req.body;

    const [repRows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (repRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = repRows[0];

    await pool.execute(
      `UPDATE reports
       SET status = ?, admin_id = ?, admin_notes = ?, resolved_at = NOW()
       WHERE id = ?`,
      [status || 'reviewed', adminId, admin_notes || null, reportId]
    );

    // If admin chooses to hide the reported resource
    if (hide_resource) {
      await pool.execute("UPDATE resources SET moderation_status = 'hidden' WHERE id = ?", [
        report.resource_id,
      ]);
    }

    // Log admin activity
    await pool.execute(
      'INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        adminId,
        'UPDATE_REPORT_STATUS',
        'report',
        reportId,
        `Status updated to ${status}. Hide resource: ${hide_resource ? 'Yes' : 'No'}.`,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Report resolved and updated.',
    });
  } catch (error) {
    console.error('[Update Report Status Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
}

module.exports = {
  createReport,
  getAdminReports,
  updateReportStatus,
};
