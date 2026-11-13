const { pool } = require('../config/db');

/**
 * Get personalized student dashboard statistics
 * GET /api/dashboard/stats
 */
async function getStudentStats(req, res) {
  try {
    const userId = req.user.id;

    // Total resources available on platform
    const [totalRes] = await pool.execute(
      "SELECT COUNT(*) AS total FROM resources WHERE moderation_status = 'approved'"
    );

    // My uploaded resources
    const [myUploads] = await pool.execute(
      'SELECT COUNT(*) AS total FROM resources WHERE uploader_id = ?',
      [userId]
    );

    // My downloads count
    const [myDownloads] = await pool.execute(
      'SELECT COUNT(*) AS total FROM downloads WHERE user_id = ?',
      [userId]
    );

    // My bookmarks count
    const [myBookmarks] = await pool.execute(
      'SELECT COUNT(*) AS total FROM bookmarks WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      stats: {
        totalResourcesAvailable: totalRes[0].total,
        myUploadedResources: myUploads[0].total,
        myDownloads: myDownloads[0].total,
        myBookmarks: myBookmarks[0].total,
      },
    });
  } catch (error) {
    console.error('[Student Stats Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics.' });
  }
}

/**
 * Get personalized student dashboard feeds (Recently uploaded, Popular, Recommended, Activity)
 * GET /api/dashboard/overview
 */
async function getStudentDashboardOverview(req, res) {
  try {
    const userId = req.user.id;
    const courseId = req.user.course_id;
    const semesterId = req.user.semester_id;

    // 1. Recently Uploaded (Latest 5 approved resources)
    const [recentlyUploaded] = await pool.execute(`
      SELECT r.id, r.title, r.resource_type, r.average_rating, r.download_count, r.created_at,
             r.file_type, r.file_size, c.course_code, s.semester_number, sub.subject_name,
             u.full_name AS uploader_name
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN users u ON r.uploader_id = u.id
      WHERE r.moderation_status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT 6
    `);

    // 2. Popular Resources (Top 6 by download count & rating)
    const [popularResources] = await pool.execute(`
      SELECT r.id, r.title, r.resource_type, r.average_rating, r.download_count, r.created_at,
             r.file_type, r.file_size, c.course_code, s.semester_number, sub.subject_name,
             u.full_name AS uploader_name
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN users u ON r.uploader_id = u.id
      WHERE r.moderation_status = 'approved'
      ORDER BY r.download_count DESC, r.average_rating DESC
      LIMIT 6
    `);

    // 3. Recommended for You (Matching student's enrolled course and semester, or popular fallback)
    let recommendedQuery = `
      SELECT r.id, r.title, r.resource_type, r.average_rating, r.download_count, r.created_at,
             r.file_type, r.file_size, c.course_code, s.semester_number, sub.subject_name,
             u.full_name AS uploader_name,
             -- Scoring: matching course (3 pts), matching semester (4 pts), rating bonus
             ((CASE WHEN r.course_id = ? THEN 3 ELSE 0 END) +
              (CASE WHEN r.semester_id = ? THEN 4 ELSE 0 END) +
              (r.average_rating * 1.5)) AS recommendation_score
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN users u ON r.uploader_id = u.id
      WHERE r.moderation_status = 'approved'
        AND r.uploader_id != ?
      ORDER BY recommendation_score DESC, r.download_count DESC
      LIMIT 6
    `;

    const [recommended] = await pool.execute(recommendedQuery, [
      courseId || 0,
      semesterId || 0,
      userId,
    ]);

    // 4. Student Recent Activity Feed (Recent downloads, uploads, bookmarks combined)
    const [recentActivity] = await pool.execute(`
      (SELECT 'download' AS activity_type, r.id AS resource_id, r.title AS resource_title, 
              d.downloaded_at AS timestamp, 'Downloaded' AS action_label
       FROM downloads d
       JOIN resources r ON d.resource_id = r.id
       WHERE d.user_id = ?
       ORDER BY d.downloaded_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'bookmark' AS activity_type, r.id AS resource_id, r.title AS resource_title, 
              b.created_at AS timestamp, 'Bookmarked' AS action_label
       FROM bookmarks b
       JOIN resources r ON b.resource_id = r.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'upload' AS activity_type, r.id AS resource_id, r.title AS resource_title, 
              r.created_at AS timestamp, 'Uploaded' AS action_label
       FROM resources r
       WHERE r.uploader_id = ?
       ORDER BY r.created_at DESC LIMIT 5)
      ORDER BY timestamp DESC
      LIMIT 8
    `, [userId, userId, userId]);

    // Check bookmarked resource IDs for current user to render bookmark status in cards
    const [userBookmarks] = await pool.execute(
      'SELECT resource_id FROM bookmarks WHERE user_id = ?',
      [userId]
    );
    const bookmarkedIds = userBookmarks.map((b) => b.resource_id);

    res.status(200).json({
      success: true,
      recentlyUploaded,
      popularResources,
      recommended: recommended.length > 0 ? recommended : popularResources,
      recentActivity,
      bookmarkedIds,
    });
  } catch (error) {
    console.error('[Dashboard Overview Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard overview.' });
  }
}

module.exports = {
  getStudentStats,
  getStudentDashboardOverview,
};
