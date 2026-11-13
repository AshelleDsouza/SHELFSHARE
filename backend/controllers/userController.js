const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get user profile with aggregated statistics
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.college_name, u.profile_image, u.created_at,
              u.course_id, c.course_name, c.course_code,
              u.semester_id, s.semester_number
       FROM users u
       LEFT JOIN courses c ON u.course_id = c.id
       LEFT JOIN semesters s ON u.semester_id = s.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Compute user statistics
    const [[{ total_uploads }]] = await pool.query(
      `SELECT COUNT(*) AS total_uploads FROM resources WHERE uploader_id = ? AND moderation_status = 'approved'`,
      [userId]
    );

    const [[{ total_downloads }]] = await pool.query(
      `SELECT COUNT(*) AS total_downloads FROM downloads WHERE user_id = ?`,
      [userId]
    );

    const [[{ total_bookmarks }]] = await pool.query(
      `SELECT COUNT(*) AS total_bookmarks FROM bookmarks WHERE user_id = ?`,
      [userId]
    );

    const [[{ total_reviews }]] = await pool.query(
      `SELECT COUNT(*) AS total_reviews FROM reviews WHERE user_id = ?`,
      [userId]
    );

    const [[{ avg_rating }]] = await pool.query(
      `SELECT COALESCE(AVG(average_rating), 0) AS avg_rating FROM resources WHERE uploader_id = ? AND moderation_status = 'approved'`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...user,
        stats: {
          totalUploads: total_uploads,
          totalDownloads: total_downloads,
          totalBookmarks: total_bookmarks,
          totalReviews: total_reviews,
          averageResourceRating: parseFloat(Number(avg_rating).toFixed(1))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile information
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, college_name, course_id, semester_id, profile_image } = req.body;

    if (!full_name || full_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    await pool.query(
      `UPDATE users 
       SET full_name = ?, 
           college_name = COALESCE(?, college_name),
           course_id = COALESCE(?, course_id),
           semester_id = COALESCE(?, semester_id),
           profile_image = COALESCE(?, profile_image)
       WHERE id = ?`,
      [full_name.trim(), college_name || null, course_id || null, semester_id || null, profile_image || null, userId]
    );

    // Return updated user
    const [updatedUsers] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.college_name, u.profile_image,
              u.course_id, c.course_name, c.course_code,
              u.semester_id, s.semester_number
       FROM users u
       LEFT JOIN courses c ON u.course_id = c.id
       LEFT JOIN semesters s ON u.semester_id = s.id
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUsers[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const [users] = await pool.query(
      `SELECT password_hash FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [newHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
