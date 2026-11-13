const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shelfshare_super_secret_jwt_key_2026_mca_project';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token containing essential user claims
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Set secure HTTP-only cookie for authentication
 */
function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('shelfshare_token', token, {
    httpOnly: true,
    secure: isProduction, // HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  });
}

/**
 * Clear the auth cookie on logout
 */
function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('shelfshare_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    expires: new Date(0),
    path: '/',
  });
}

module.exports = {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
