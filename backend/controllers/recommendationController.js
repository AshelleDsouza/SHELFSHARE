const { pool } = require('../config/db');

/**
 * Compute transparent quality indicator badge based on documented formula:
 * - Highly Rated: average_rating >= 4.5 AND total_reviews >= 3
 * - Popular: download_count >= 30
 * - Peer Reviewed: total_reviews >= 1
 * - Recently Added: added within last 14 days
 */
function getQualityIndicator(resource) {
  const rating = parseFloat(resource.average_rating || 0);
  const reviews = parseInt(resource.total_reviews || 0, 10);
  const downloads = parseInt(resource.download_count || 0, 10);
  const createdAt = new Date(resource.created_at);
  const isRecent = Date.now() - createdAt.getTime() < 14 * 24 * 60 * 60 * 1000;

  if (rating >= 4.5 && reviews >= 3) {
    return { label: 'Highly Rated', color: '#ED6C02', bg: '#FFF3E0' };
  }
  if (downloads >= 30) {
    return { label: 'Popular', color: 'var(--primary)', bg: 'var(--secondary-light)' };
  }
  if (reviews >= 1) {
    return { label: 'Peer Reviewed', color: 'var(--success)', bg: 'var(--success-bg)' };
  }
  if (isRecent) {
    return { label: 'Recently Added', color: '#1E88E5', bg: '#E3F2FD' };
  }
  return { label: 'Academic Resource', color: 'var(--text-secondary)', bg: 'var(--bg-main)' };
}

/**
 * Transparent Rule-Based Recommendation Engine:
 *
 * Scoring Algorithm Weights:
 * 1. Matching Student Course: +3.0 points
 * 2. Matching Student Semester: +4.0 points (direct syllabus relevance)
 * 3. Interacted Subject Affinity: +3.0 points (subjects the student has downloaded or bookmarked)
 * 4. Academic Quality Bonus: average_rating * 1.5 (up to 7.5 points)
 * 5. Download Popularity Bonus: LOG10(download_count + 1) * 2.0 (logarithmic smoothing)
 * 6. Content Recency Bonus: +1.0 point if uploaded within the last 30 days
 *
 * Deductions:
 * - Excludes materials uploaded by the student themselves.
 * - Excludes hidden or unapproved materials.
 *
 * GET /api/resources/recommended
 */
async function getRecommendedResources(req, res) {
  try {
    const userId = req.user.id;
    const courseId = req.user.course_id || 0;
    const semesterId = req.user.semester_id || 0;

    // Identify subjects the student previously interacted with (downloaded or bookmarked)
    const [interactedSubjectRows] = await pool.execute(
      `(SELECT r.subject_id FROM downloads d JOIN resources r ON d.resource_id = r.id WHERE d.user_id = ?)
       UNION
       (SELECT r.subject_id FROM bookmarks b JOIN resources r ON b.resource_id = r.id WHERE b.user_id = ?)`,
      [userId, userId]
    );

    const interactedSubjectIds = interactedSubjectRows.map((row) => row.subject_id);
    const hasSubjectAffinity = interactedSubjectIds.length > 0;

    // Build recommendation query
    let query = `
      SELECT r.id, r.title, r.description, r.course_id, r.semester_id, r.subject_id,
             r.unit_name, r.resource_type, r.file_type, r.file_size, r.download_count,
             r.average_rating, r.total_reviews, r.created_at,
             c.course_code, s.semester_number, sub.subject_name,
             u.full_name AS uploader_name,
             (
               -- 1. Matching enrolled course (3 points)
               (CASE WHEN r.course_id = ? THEN 3.0 ELSE 0.0 END) +
               -- 2. Matching current semester (4 points)
               (CASE WHEN r.semester_id = ? THEN 4.0 ELSE 0.0 END) +
               -- 3. Interacted subject bonus (3 points)
               ${hasSubjectAffinity ? `(CASE WHEN r.subject_id IN (${interactedSubjectIds.join(',')}) THEN 3.0 ELSE 0.0 END) +` : ''}
               -- 4. Rating quality bonus (rating * 1.5)
               (r.average_rating * 1.5) +
               -- 5. Popularity bonus with logarithmic smoothing
               (LOG10(r.download_count + 1) * 2.0) +
               -- 6. Recency bonus (1 point if within 30 days)
               (CASE WHEN r.created_at >= NOW() - INTERVAL 30 DAY THEN 1.0 ELSE 0.0 END)
             ) AS recommendation_score
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN users u ON r.uploader_id = u.id
      WHERE r.moderation_status = 'approved'
        AND r.uploader_id != ?
      ORDER BY recommendation_score DESC, r.download_count DESC
      LIMIT 8
    `;

    const [rows] = await pool.execute(query, [courseId, semesterId, userId]);

    // Attach quality indicators to each recommended item
    const recommended = rows.map((resItem) => ({
      ...resItem,
      quality: getQualityIndicator(resItem),
      qualityBadges: {
        curriculumMatch: resItem.course_id === courseId && resItem.semester_id === semesterId,
        isHighQuality: parseFloat(resItem.average_rating || 0) >= 4.5 && parseInt(resItem.total_reviews || 0, 10) >= 3,
        isPopular: parseInt(resItem.download_count || 0, 10) >= 20,
      },
    }));

    return res.status(200).json({
      success: true,
      algorithm: 'Weighted multi-factor rule-based recommendation (Course, Semester, Subject affinity, Rating, Popularity, Recency)',
      recommendations: recommended,
    });
  } catch (error) {
    console.error('[Recommendation Engine Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to compute recommendations.' });
  }
}

/**
 * Get popular resources across the entire platform
 * GET /api/resources/popular
 */
async function getPopularResources(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT r.id, r.title, r.description, r.course_id, r.semester_id, r.subject_id,
             r.unit_name, r.resource_type, r.file_type, r.file_size, r.download_count,
             r.average_rating, r.total_reviews, r.created_at,
             c.course_code, s.semester_number, sub.subject_name,
             u.full_name AS uploader_name
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN users u ON r.uploader_id = u.id
      WHERE r.moderation_status = 'approved'
      ORDER BY r.download_count DESC, r.average_rating DESC
      LIMIT 8
    `);

    const popular = rows.map((resItem) => ({
      ...resItem,
      quality: getQualityIndicator(resItem),
    }));

    return res.status(200).json({
      success: true,
      resources: popular,
    });
  } catch (error) {
    console.error('[Popular Resources Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve popular resources.' });
  }
}

module.exports = {
  getQualityIndicator,
  getRecommendedResources,
  getPopularResources,
};
