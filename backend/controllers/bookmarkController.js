const { pool } = require('../config/db');

/**
 * Get all bookmarked resources for the logged-in student
 * GET /api/bookmarks
 */
async function getBookmarks(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT b.id AS bookmark_id, b.resource_id, b.created_at AS bookmarked_at,
              r.id, r.title, r.description, r.resource_type, r.file_type, r.file_size,
              r.average_rating, r.download_count, r.created_at,
              c.course_code, s.semester_number, sub.subject_name,
              u.full_name AS uploader_name
       FROM bookmarks b
       JOIN resources r ON b.resource_id = r.id
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       JOIN users u ON r.uploader_id = u.id
       WHERE b.user_id = ? AND r.moderation_status = 'approved'
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      bookmarks: rows,
    });
  } catch (error) {
    console.error('[Get Bookmarks Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookmarks.' });
  }
}

/**
 * Add a resource to bookmarks
 * POST /api/bookmarks/:resourceId
 */
async function addBookmark(req, res) {
  try {
    const userId = req.user.id;
    const resourceId = req.params.resourceId;

    // Verify resource exists
    const [resRows] = await pool.execute('SELECT id, title FROM resources WHERE id = ?', [
      resourceId,
    ]);
    if (resRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // Insert ignore to handle duplicates safely
    await pool.execute(
      'INSERT INTO bookmarks (user_id, resource_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP',
      [userId, resourceId]
    );

    return res.status(201).json({
      success: true,
      message: 'Resource bookmarked successfully.',
    });
  } catch (error) {
    console.error('[Add Bookmark Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to add bookmark.' });
  }
}

/**
 * Remove a resource from bookmarks
 * DELETE /api/bookmarks/:resourceId
 */
async function removeBookmark(req, res) {
  try {
    const userId = req.user.id;
    const resourceId = req.params.resourceId;

    await pool.execute('DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?', [
      userId,
      resourceId,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Resource removed from bookmarks.',
    });
  } catch (error) {
    console.error('[Remove Bookmark Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to remove bookmark.' });
  }
}

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
};
