const { pool } = require('../config/db');

/**
 * Get all available courses
 * GET /api/academic/courses
 */
async function getCourses(req, res) {
  try {
    const [courses] = await pool.execute('SELECT id, course_code, course_name, course_code AS code, course_name AS name FROM courses ORDER BY course_name ASC');
    res.status(200).json({ success: true, courses, data: courses });
  } catch (error) {
    console.error('[Get Courses Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve courses.' });
  }
}

/**
 * Get semesters for a specific course
 * GET /api/academic/courses/:courseId/semesters
 */
async function getSemestersByCourse(req, res) {
  try {
    const { courseId } = req.params;
    const [semesters] = await pool.execute(
      'SELECT id, course_id, semester_number FROM semesters WHERE course_id = ? ORDER BY semester_number ASC',
      [courseId]
    );
    res.status(200).json({ success: true, semesters, data: semesters });
  } catch (error) {
    console.error('[Get Semesters Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve semesters.' });
  }
}

/**
 * Get subjects, optionally filtered by course_id and semester_id
 * GET /api/academic/subjects
 */
async function getSubjects(req, res) {
  try {
    const { course_id, semester_id } = req.query;
    let query = `
      SELECT sub.id, sub.subject_name, sub.subject_code, sub.description,
             sub.course_id, sub.semester_id, c.course_code, c.course_name, s.semester_number
      FROM subjects sub
      JOIN courses c ON sub.course_id = c.id
      JOIN semesters s ON sub.semester_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) {
      query += ' AND sub.course_id = ?';
      params.push(course_id);
    }
    if (semester_id) {
      query += ' AND sub.semester_id = ?';
      params.push(semester_id);
    }

    query += ' ORDER BY c.course_code ASC, s.semester_number ASC, sub.subject_name ASC';

    const [subjects] = await pool.execute(query, params);
    res.status(200).json({ success: true, subjects, data: subjects });
  } catch (error) {
    console.error('[Get Subjects Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve subjects.' });
  }
}

module.exports = {
  getCourses,
  getSemestersByCourse,
  getSubjects,
};
