import jwt from 'jsonwebtoken';

// ── JWT Secret — MUST be set via environment variable ──────────
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set.');
  console.error('   Set a strong random string (min 32 characters) in your .env file.');
  process.exit(1);
}

// Token expiry configuration
const TOKEN_EXPIRY = '7d';

/**
 * JWT authentication middleware.
 * Extracts and verifies Bearer token from Authorization header.
 * Attaches decoded user to req.user on success.
 */
export default function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = header.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate payload structure
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ error: 'Invalid token payload. Please log in again.' });
    }

    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
    return res.status(401).json({ error: 'Authentication failed. Please log in again.' });
  }
}

/**
 * Generate a JWT token for a user.
 * @param {Object} user - User document from MongoDB
 * @returns {string} Signed JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}
