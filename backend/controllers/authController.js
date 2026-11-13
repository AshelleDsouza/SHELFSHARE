const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

// In-memory reset code cache for academic demonstration: { email: { code, expiresAt } }
const passwordResetStore = new Map();

/**
 * Register a new student account
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { full_name, email, password, college_name, course_id, semester_id } = req.body;

    // Check if email is already registered
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in instead.',
      });
    }

    // Verify course and semester exist
    const [courses] = await pool.execute('SELECT id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected course does not exist.',
      });
    }

    const [semesters] = await pool.execute(
      'SELECT id FROM semesters WHERE id = ? AND course_id = ?',
      [semester_id, course_id]
    );
    if (semesters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected semester does not correspond to the chosen course.',
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user into database (strictly 'student' role, 'active' status)
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, college_name, course_id, semester_id, role, account_status)
       VALUES (?, ?, ?, ?, ?, ?, 'student', 'active')`,
      [full_name, email, password_hash, college_name, course_id, semester_id]
    );

    const newUserId = result.insertId;

    // Create a personalized welcome notification
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Welcome to ShelfShare!', 'Welcome to the platform! Discover curated study materials or upload your own notes to help your peers.', 'general')`,
      [newUserId]
    );

    // Fetch newly created user with course details
    const [newUsers] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.college_name, u.course_id, u.semester_id, 
              u.role, u.account_status, u.created_at,
              c.course_name, c.course_code, s.semester_number
       FROM users u
       LEFT JOIN courses c ON u.course_id = c.id
       LEFT JOIN semesters s ON u.semester_id = s.id
       WHERE u.id = ?`,
      [newUserId]
    );

    const user = newUsers[0];
    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to ShelfShare.',
      token,
      user,
    });
  } catch (error) {
    console.error('[Register Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create student account due to a server error.',
    });
  }
}

/**
 * User login
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Fetch user including password hash
    const [users] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.college_name, u.course_id, u.semester_id, 
              u.role, u.account_status, u.created_at,
              c.course_name, c.course_code, s.semester_number
       FROM users u
       LEFT JOIN courses c ON u.course_id = c.id
       LEFT JOIN semesters s ON u.semester_id = s.id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const user = users[0];

    // Check account status
    if (user.account_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator. Please contact support.',
      });
    }

    if (user.account_status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support.',
      });
    }

    // Verify bcrypt password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    // Strip password_hash before returning
    delete user.password_hash;

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      token,
      user,
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log in due to a server error.',
    });
  }
}

/**
 * Logout
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('[Logout Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Error during logout.',
    });
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('[GetMe Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
    });
  }
}

/**
 * Forgot password request
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const [users] = await pool.execute('SELECT id, full_name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Do not reveal whether email exists for security, but return helpful message
      return res.status(200).json({
        success: true,
        message: 'If the email exists in our system, a password reset code has been generated.',
      });
    }

    // Generate 6-digit reset code valid for 15 minutes
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    passwordResetStore.set(email.toLowerCase(), {
      code: resetCode,
      expiresAt,
    });

    console.log(`[Password Reset] Demo Reset Code for ${email}: ${resetCode}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset code generated. Use the demo reset code provided to set a new password.',
      demo_reset_code: resetCode, // Returned for instant viva / testing convenience without requiring third-party mailer
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request.',
    });
  }
}

/**
 * Reset password
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { email, reset_code, new_password } = req.body;

    const resetData = passwordResetStore.get(email.toLowerCase());
    if (!resetData || resetData.code !== reset_code || Date.now() > resetData.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code. Please request a new one.',
      });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, email]);

    // Clear reset code
    passwordResetStore.delete(email.toLowerCase());

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You may now log in with your new credentials.',
    });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
