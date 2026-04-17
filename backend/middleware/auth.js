import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'curalink_dev_secret_change_in_prod';

/**
 * Express middleware — verifies Bearer JWT.
 * Attaches req.userId (string) on success.
 */
export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}
