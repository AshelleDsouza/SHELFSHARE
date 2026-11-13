const { pool } = require('../config/db');

/**
 * Get public platform statistics for the Landing Page (100% real database counts)
 * GET /api/public/stats
 */
async function getPublicStats(req, res) {
  try {
    const [resourceCount] = await pool.execute(
      "SELECT COUNT(*) AS total FROM resources WHERE moderation_status = 'approved'"
    );
    const [downloadCount] = await pool.execute('SELECT COUNT(*) AS total FROM downloads');
    const [studentCount] = await pool.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'student' AND account_status = 'active'"
    );
    const [courseCount] = await pool.execute('SELECT COUNT(*) AS total FROM courses');
    const [subjectCount] = await pool.execute('SELECT COUNT(*) AS total FROM subjects');

    // Get 4 featured recent approved resources for the landing page preview
    const [featuredResources] = await pool.execute(`
      SELECT r.id, r.title, r.resource_type, r.average_rating, r.download_count,
             c.course_code, s.semester_number, sub.subject_name
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      WHERE r.moderation_status = 'approved'
      ORDER BY r.download_count DESC, r.average_rating DESC
      LIMIT 4
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalResources: resourceCount[0].total,
        totalDownloads: downloadCount[0].total,
        activeStudents: studentCount[0].total,
        totalCourses: courseCount[0].total,
        totalSubjects: subjectCount[0].total,
      },
      featuredResources,
    });
  } catch (error) {
    console.error('[Public Stats Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve platform statistics.' });
  }
}

module.exports = {
  getPublicStats,
};
