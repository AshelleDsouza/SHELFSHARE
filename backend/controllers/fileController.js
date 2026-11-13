const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');

/**
 * Preview PDF document in browser viewer
 * GET /api/resources/:id/preview
 */
async function previewResource(req, res) {
  try {
    const resourceId = req.params.id;

    const [rows] = await pool.execute('SELECT * FROM resources WHERE id = ?', [resourceId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const resource = rows[0];

    // Check moderation status
    const isOwner = req.user && req.user.id === resource.uploader_id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (resource.moderation_status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This resource is not publicly accessible.',
      });
    }

    // Only PDF files support embedded in-app preview
    if (resource.file_type?.toLowerCase() !== 'pdf') {
      return res.status(400).json({
        success: false,
        message: `In-browser preview is only supported for PDF files. Please use the download option for ${resource.file_type?.toUpperCase()} files.`,
      });
    }

    // Cloudinary / Remote persistent URL
    if (resource.file_path && resource.file_path.startsWith('http')) {
      return res.redirect(resource.file_path);
    }

    // Prevent directory traversal: verify target path is inside uploads directory
    const resolvedPath = path.resolve(uploadsDir, resource.stored_file_name);
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ success: false, message: 'Invalid file path.' });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'The requested document file could not be found on the server.',
      });
    }

    // Stream the PDF with inline disposition
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resource.file_name}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[Preview Resource Error]', error);
    return res.status(500).json({ success: false, message: 'Error streaming document preview.' });
  }
}

/**
 * Download resource and record download history in MySQL
 * GET /api/resources/:id/download
 */
async function downloadResource(req, res) {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;

    const [rows] = await pool.execute('SELECT * FROM resources WHERE id = ?', [resourceId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const resource = rows[0];

    // Check moderation status
    const isOwner = req.user && req.user.id === resource.uploader_id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (resource.moderation_status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This resource is currently not available for download.',
      });
    }

    // Check if hosted on Cloudinary / Remote URL
    if (resource.file_path && resource.file_path.startsWith('http')) {
      // Atomic increment of download count in MySQL
      await pool.execute(
        'UPDATE resources SET download_count = download_count + 1 WHERE id = ?',
        [resourceId]
      );

      // Record authenticated download in downloads table
      await pool.execute(
        'INSERT INTO downloads (user_id, resource_id, downloaded_at) VALUES (?, ?, NOW())',
        [userId, resourceId]
      );

      return res.redirect(resource.file_path);
    }

    // Validate path to prevent directory traversal
    const resolvedPath = path.resolve(uploadsDir, resource.stored_file_name);
    if (!resolvedPath.startsWith(uploadsDir) || !fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'The file associated with this resource was not found on the server.',
      });
    }

    // Atomic increment of download count in MySQL
    await pool.execute(
      'UPDATE resources SET download_count = download_count + 1 WHERE id = ?',
      [resourceId]
    );

    // Record authenticated download in downloads table
    await pool.execute(
      'INSERT INTO downloads (user_id, resource_id, downloaded_at) VALUES (?, ?, NOW())',
      [userId, resourceId]
    );

    // Stream download with attachment disposition
    res.download(resolvedPath, resource.file_name, (err) => {
      if (err && !res.headersSent) {
        console.error('[Download Stream Error]', err);
        return res.status(500).json({ success: false, message: 'Failed to stream download.' });
      }
    });
  } catch (error) {
    console.error('[Download Resource Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process download request.',
    });
  }
}

/**
 * Get student's download history
 * GET /api/downloads/history
 */
async function getDownloadHistory(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT d.id AS download_id, d.downloaded_at,
              r.id AS resource_id, r.title, r.resource_type, r.file_type, r.file_size,
              r.file_name, r.average_rating, r.download_count,
              c.course_code, s.semester_number, sub.subject_name,
              u.full_name AS uploader_name
       FROM downloads d
       JOIN resources r ON d.resource_id = r.id
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       JOIN users u ON r.uploader_id = u.id
       WHERE d.user_id = ?
       ORDER BY d.downloaded_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      downloads: rows,
    });
  } catch (error) {
    console.error('[Get Download History Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve download history.',
    });
  }
}

module.exports = {
  previewResource,
  downloadResource,
  getDownloadHistory,
};
