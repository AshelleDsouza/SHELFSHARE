const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');

/**
 * Explore resources with search, multi-filters, sorting, and pagination
 * GET /api/resources
 */
async function getResources(req, res) {
  try {
    const {
      q,
      course_id,
      semester_id,
      subject_id,
      resource_type,
      academic_year,
      min_rating,
      sort = 'recent',
      page = 1,
      limit = 9,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 9));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "WHERE r.moderation_status = 'approved'";
    const params = [];

    // Search query across title, description, tags, unit_name, subject_name
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereClause += ` AND (
        r.title LIKE ? OR 
        r.description LIKE ? OR 
        r.tags LIKE ? OR 
        r.unit_name LIKE ? OR 
        sub.subject_name LIKE ? OR
        c.course_code LIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filter by Course
    if (course_id) {
      whereClause += ' AND r.course_id = ?';
      params.push(course_id);
    }

    // Filter by Semester
    if (semester_id) {
      whereClause += ' AND r.semester_id = ?';
      params.push(semester_id);
    }

    // Filter by Subject
    if (subject_id) {
      whereClause += ' AND r.subject_id = ?';
      params.push(subject_id);
    }

    // Filter by Resource Type
    if (resource_type) {
      whereClause += ' AND r.resource_type = ?';
      params.push(resource_type);
    }

    // Filter by Academic Year
    if (academic_year) {
      whereClause += ' AND r.academic_year = ?';
      params.push(academic_year);
    }

    // Filter by Minimum Rating
    if (min_rating) {
      whereClause += ' AND r.average_rating >= ?';
      params.push(parseFloat(min_rating));
    }

    // Sorting
    let orderBy = 'r.created_at DESC';
    switch (sort) {
      case 'most_downloaded':
        orderBy = 'r.download_count DESC, r.average_rating DESC';
        break;
      case 'highest_rated':
        orderBy = 'r.average_rating DESC, r.download_count DESC';
        break;
      case 'alphabetical':
        orderBy = 'r.title ASC';
        break;
      case 'recent':
      default:
        orderBy = 'r.created_at DESC';
        break;
    }

    // Count total matching records for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      ${whereClause}
    `;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    // Fetch paginated resources
    const dataSql = `
      SELECT r.id, r.title, r.description, r.course_id, r.semester_id, r.subject_id,
             r.unit_name, r.resource_type, r.tags, r.file_name, r.file_type, r.file_size,
             r.academic_year, r.download_count, r.average_rating, r.total_reviews,
             r.moderation_status, r.created_at,
             c.course_code, c.course_name, s.semester_number,
             sub.subject_name, sub.subject_code,
             u.full_name AS uploader_name, u.college_name AS uploader_college
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON r.semester_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN users u ON r.uploader_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    const [resources] = await pool.execute(dataSql, params);

    // If user is authenticated, determine their bookmarked resource IDs
    let userBookmarks = [];
    if (req.user && req.user.id) {
      const [bmRows] = await pool.execute('SELECT resource_id FROM bookmarks WHERE user_id = ?', [
        req.user.id,
      ]);
      userBookmarks = bmRows.map((b) => b.resource_id);
    }

    return res.status(200).json({
      success: true,
      resources,
      userBookmarks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('[Get Resources Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve academic library resources.',
    });
  }
}

/**
 * Get detailed information for a specific resource
 * GET /api/resources/:id
 */
async function getResourceById(req, res) {
  try {
    const resourceId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT r.*, c.course_code, c.course_name, s.semester_number,
              sub.subject_name, sub.subject_code, sub.description AS subject_description,
              u.id AS uploader_user_id, u.full_name AS uploader_name, u.college_name AS uploader_college,
              u.created_at AS uploader_joined
       FROM resources r
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       JOIN users u ON r.uploader_id = u.id
       WHERE r.id = ?`,
      [resourceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Academic resource not found.' });
    }

    const resource = rows[0];

    // If resource is hidden/pending and viewer is not the uploader or admin, block access
    const isOwner = req.user && req.user.id === resource.uploader_id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (resource.moderation_status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This resource is pending administrative moderation or has been hidden.',
      });
    }

    // Check if current user has bookmarked this resource
    let isBookmarked = false;
    if (req.user && req.user.id) {
      const [bm] = await pool.execute(
        'SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?',
        [req.user.id, resourceId]
      );
      isBookmarked = bm.length > 0;
    }

    // Fetch reviews for this resource
    const [reviews] = await pool.execute(
      `SELECT rev.id, rev.rating, rev.comment, rev.created_at, rev.updated_at,
              u.id AS reviewer_id, u.full_name AS reviewer_name, u.college_name AS reviewer_college
       FROM reviews rev
       JOIN users u ON rev.user_id = u.id
       WHERE rev.resource_id = ?
       ORDER BY rev.created_at DESC`,
      [resourceId]
    );

    // Fetch related materials (from same course and subject)
    const [relatedResources] = await pool.execute(
      `SELECT r.id, r.title, r.resource_type, r.average_rating, r.download_count, r.file_type,
              c.course_code, s.semester_number, sub.subject_name
       FROM resources r
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       WHERE r.subject_id = ? AND r.id != ? AND r.moderation_status = 'approved'
       ORDER BY r.download_count DESC
       LIMIT 4`,
      [resource.subject_id, resourceId]
    );

    return res.status(200).json({
      success: true,
      resource,
      isBookmarked,
      reviews,
      relatedResources,
    });
  } catch (error) {
    console.error('[Get Resource By ID Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve resource details.',
    });
  }
}

/**
 * Upload and create a new academic resource
 * POST /api/resources
 */
async function createResource(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required. Please attach a valid PDF, DOC, DOCX, PPT, or PPTX file.',
      });
    }

    const {
      title,
      description,
      course_id,
      semester_id,
      subject_id,
      unit_name,
      resource_type,
      tags,
      academic_year,
    } = req.body;

    const uploader_id = req.user.id;

    // Verify course, semester, and subject relationship
    const [subjectRows] = await pool.execute(
      `SELECT sub.id, sub.subject_name, c.id AS course_id, s.id AS semester_id
       FROM subjects sub
       JOIN courses c ON sub.course_id = c.id
       JOIN semesters s ON sub.semester_id = s.id
       WHERE sub.id = ? AND sub.course_id = ? AND sub.semester_id = ?`,
      [subject_id, course_id, semester_id]
    );

    if (subjectRows.length === 0) {
      // Clean up uploaded file if validation fails
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid academic mapping: the selected subject does not match the chosen course and semester.',
      });
    }

    // Extract file info
    const originalFileName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFileName = req.file.filename;
    const relativeFilePath = path.join('uploads', storedFileName).replace(/\\/g, '/');
    const fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const fileSize = req.file.size;

    // Insert resource record into MySQL
    const [result] = await pool.execute(
      `INSERT INTO resources (
        title, description, course_id, semester_id, subject_id, unit_name, resource_type,
        tags, file_name, stored_file_name, file_path, file_type, file_size, uploader_id,
        academic_year, moderation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [
        title,
        description,
        course_id,
        semester_id,
        subject_id,
        unit_name || null,
        resource_type,
        tags || null,
        originalFileName,
        storedFileName,
        relativeFilePath,
        fileType,
        fileSize,
        uploader_id,
        academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      ]
    );

    const resourceId = result.insertId;

    // Create an in-app notification for the uploader
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Resource Upload Successful', ?, 'upload_success', ?)`,
      [
        uploader_id,
        `Your study material "${title}" is now uploaded and available to student peers.`,
        `/resources/${resourceId}`,
      ]
    );

    // Fetch the complete created resource with join details
    const [createdRows] = await pool.execute(
      `SELECT r.*, c.course_code, c.course_name, s.semester_number, sub.subject_name, sub.subject_code,
              u.full_name AS uploader_name
       FROM resources r
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       JOIN users u ON r.uploader_id = u.id
       WHERE r.id = ?`,
      [resourceId]
    );

    return res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully!',
      resource: createdRows[0],
      data: createdRows[0],
    });
  } catch (error) {
    console.error('[Create Resource Error]', error);
    // Remove orphaned file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to upload and save resource to database.',
    });
  }
}

/**
 * Get resources uploaded by the authenticated student
 * GET /api/resources/my-uploads
 */
async function getMyUploads(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT r.*, c.course_code, c.course_name, s.semester_number, sub.subject_name, sub.subject_code
       FROM resources r
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       WHERE r.uploader_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      resources: rows,
    });
  } catch (error) {
    console.error('[Get My Uploads Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your uploads.',
    });
  }
}

/**
 * Edit resource metadata (only by uploader or admin)
 * PUT /api/resources/:id
 */
async function updateResource(req, res) {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Verify existence & ownership
    const [rows] = await pool.execute('SELECT * FROM resources WHERE id = ?', [resourceId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const resource = rows[0];
    if (!isAdmin && resource.uploader_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own uploads.',
      });
    }

    const { title, description, resource_type, unit_name, tags } = req.body;

    await pool.execute(
      `UPDATE resources
       SET title = ?, description = ?, resource_type = ?, unit_name = ?, tags = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, description, resource_type, unit_name || null, tags || null, resourceId]
    );

    // Return updated resource
    const [updatedRows] = await pool.execute(
      `SELECT r.*, c.course_code, s.semester_number, sub.subject_name
       FROM resources r
       JOIN courses c ON r.course_id = c.id
       JOIN semesters s ON r.semester_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       WHERE r.id = ?`,
      [resourceId]
    );

    return res.status(200).json({
      success: true,
      message: 'Resource details updated successfully.',
      resource: updatedRows[0],
    });
  } catch (error) {
    console.error('[Update Resource Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update resource.',
    });
  }
}

/**
 * Delete a resource and remove its file safely
 * DELETE /api/resources/:id
 */
async function deleteResource(req, res) {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [rows] = await pool.execute('SELECT * FROM resources WHERE id = ?', [resourceId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const resource = rows[0];
    if (!isAdmin && resource.uploader_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own uploads.',
      });
    }

    // Safely remove file on disk if not a shared demo file
    if (resource.stored_file_name && !resource.stored_file_name.startsWith('sample-')) {
      const diskPath = path.join(uploadsDir, resource.stored_file_name);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          console.warn('[File Deletion Warning]', e.message);
        }
      }
    }

    // Delete record from database (cascades related bookmarks, downloads, collection items, reviews)
    await pool.execute('DELETE FROM resources WHERE id = ?', [resourceId]);

    return res.status(200).json({
      success: true,
      message: 'Resource and associated files deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Resource Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete resource.',
    });
  }
}

module.exports = {
  getResources,
  getResourceById,
  createResource,
  getMyUploads,
  updateResource,
  deleteResource,
};
