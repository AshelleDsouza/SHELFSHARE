const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

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

function generateDynamicPdf(resource) {
  const sanitize = (text) => (text || '').replace(/[()\\\r\n]/g, ' ');
  const title = sanitize(resource.title || 'ShelfShare Academic Resource');
  const type = sanitize(resource.resource_type || 'Study Notes');
  const desc = sanitize(resource.description || 'Verified student study notes and resources.');

  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT
/F1 22 Tf
50 720 Td
(ShelfShare - Student Academic Resource) Tj
/F1 14 Tf
0 -40 Td
(${title}) Tj
/F1 11 Tf
0 -25 Td
(Type: ${type} | Format: Academic Document) Tj
0 -25 Td
(Description:) Tj
0 -18 Td
(${desc}) Tj
0 -45 Td
(Verified by ShelfShare Peer-to-Peer Academic Ecosystem) Tj
0 -20 Td
(Learn. Share. Grow.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000676 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
745
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

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

    // Cloudinary / Remote persistent URL
    if (resource.file_path && resource.file_path.startsWith('http')) {
      return res.redirect(resource.file_path);
    }

    // Set frame-ancestors to permit in-app iframe previews from frontend
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.vercel.app http://localhost:*");
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resource.file_name || 'document.pdf'}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const resolvedPath = findUploadFile(resource.stored_file_name);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      const fileStream = fs.createReadStream(resolvedPath);
      return fileStream.pipe(res);
    }

    // Fallback: Stream generated PDF for verified resources
    const pdfBuf = generateDynamicPdf(resource);
    res.setHeader('Content-Length', pdfBuf.length);
    return res.end(pdfBuf);
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

    const resolvedPath = findUploadFile(resource.stored_file_name);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      return res.download(resolvedPath, resource.file_name, (err) => {
        if (err && !res.headersSent) {
          console.error('[Download Stream Error]', err);
          return res.status(500).json({ success: false, message: 'Failed to stream download.' });
        }
      });
    }

    // Fallback: Stream generated PDF document
    const pdfBuf = generateDynamicPdf(resource);
    res.setHeader('Content-Type', 'application/pdf');
    const downloadName = resource.file_name && resource.file_name.endsWith('.pdf')
      ? resource.file_name
      : `${resource.file_name || 'document'}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', pdfBuf.length);
    return res.end(pdfBuf);
  } catch (error) {
    console.error('[Download Resource Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process download request.',
    });
  }
}
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
