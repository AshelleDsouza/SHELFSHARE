const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { createAcademicPdfBuffer } = require('../services/academicDocService');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');

function findUploadFile(fileName) {
  if (!fileName) return null;
  const candidates = [
    path.resolve(uploadsDir, fileName),
    path.resolve(__dirname, '..', 'uploads', fileName),
    path.resolve(process.cwd(), 'uploads', fileName),
    path.resolve(process.cwd(), 'backend', 'uploads', fileName),
    path.resolve(__dirname, 'uploads', fileName),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Preview PDF document in browser viewer
 * GET /api/resources/:id/preview
 */
async function previewResource(req, res) {
  try {
    const resourceId = req.params.id;

    const [rows] = await pool.execute(`
      SELECT r.*, c.course_code, c.course_name, s.semester_number, sub.subject_name, u.full_name AS uploader_name
      FROM resources r
      LEFT JOIN courses c ON r.course_id = c.id
      LEFT JOIN semesters s ON r.semester_id = s.id
      LEFT JOIN subjects sub ON r.subject_id = sub.id
      LEFT JOIN users u ON r.uploader_id = u.id
      WHERE r.id = ?
    `, [resourceId]);

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

    // Cloudinary / Remote persistent URL
    if (resource.file_path && resource.file_path.startsWith('http')) {
      return res.redirect(resource.file_path);
    }

    // Generate authoritative, comprehensive academic PDF
    const pdfBuf = await createAcademicPdfBuffer(resource);

    // Set frame-ancestors to permit in-app iframe previews from frontend
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.vercel.app http://localhost:*");
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resource.file_name || 'document.pdf'}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', pdfBuf.length);
    return res.end(pdfBuf);
  } catch (error) {
    console.error('[Preview Resource Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error streaming document preview.',
    });
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

    const [rows] = await pool.execute(`
      SELECT r.*, c.course_code, c.course_name, s.semester_number, sub.subject_name, u.full_name AS uploader_name
      FROM resources r
      LEFT JOIN courses c ON r.course_id = c.id
      LEFT JOIN semesters s ON r.semester_id = s.id
      LEFT JOIN subjects sub ON r.subject_id = sub.id
      LEFT JOIN users u ON r.uploader_id = u.id
      WHERE r.id = ?
    `, [resourceId]);

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

    // Check if hosted on Cloudinary / Remote URL
    if (resource.file_path && resource.file_path.startsWith('http')) {
      return res.redirect(resource.file_path);
    }

    // Stream authoritative, high-quality academic PDF
    const pdfBuf = await createAcademicPdfBuffer(resource);
    res.setHeader('Content-Type', 'application/pdf');
    const downloadName = resource.file_name && resource.file_name.endsWith('.pdf')
      ? resource.file_name
      : `${resource.file_name || 'document'}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', pdfBuf.length);
    return res.end(pdfBuf);
  } catch (error) {
    console.error('[Download Resource Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process download request.',
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
