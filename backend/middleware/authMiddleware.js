const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/db');

/**
 * Authenticate incoming requests by checking HTTP-only cookie or Authorization header.
 * Attaches the database user record to req.user.
 */
async function authenticateUser(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies.shelfshare_token) {
      token = req.cookies.shelfshare_token;
    }
    // 2. Fallback to Authorization: Bearer <token>
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to access this resource.',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Session has expired or token is invalid. Please sign in again.',
      });
    }

    // Fetch user from DB to verify status and fresh details
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.college_name, u.course_id, u.semester_id, 
              u.role, u.account_status, u.profile_image, u.created_at,
              c.course_name, c.course_code, s.semester_number
       FROM users u
       LEFT JOIN courses c ON u.course_id = c.id
       LEFT JOIN semesters s ON u.semester_id = s.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const user = rows[0];

    if (user.account_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator. Please contact support.',
      });
    }

    if (user.account_status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication check.',
    });
  }
}

/**
 * Optional authentication: attaches req.user if a valid token is present, but doesn't reject if guest.
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    if (req.cookies && req.cookies.shelfshare_token) {
      token = req.cookies.shelfshare_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        const [rows] = await pool.execute(
          `SELECT u.id, u.full_name, u.email, u.college_name, u.course_id, u.semester_id, 
                  u.role, u.account_status, c.course_name, c.course_code, s.semester_number
           FROM users u
           LEFT JOIN courses c ON u.course_id = c.id
           LEFT JOIN semesters s ON u.semester_id = s.id
           WHERE u.id = ? AND u.account_status = 'active'`,
          [decoded.id]
        );
        if (rows.length > 0) {
          req.user = rows[0];
        }
      }
    }
    next();
  } catch (error) {
    // Silently proceed for optional auth
    next();
  }
}

/**
 * Role-based authorization middleware.
 * Example: requireRole('admin') or requireRole('student', 'admin')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not possess the required permissions for this action.',
      });
    }

    next();
  };
}

module.exports = {
  authenticateUser,
  optionalAuth,
  requireRole,
};
