/**
 * Input sanitization middleware.
 * - Strips HTML/script tags from all string values in req.body
 * - Rejects keys starting with '$' to prevent NoSQL injection
 * - Trims whitespace from string values
 */

/**
 * Strip HTML tags from a string (prevents stored XSS).
 */
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags + content
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove remaining HTML tags
    .trim();
}

/**
 * Recursively sanitize an object's string values and reject dangerous keys.
 * @throws {Error} if a NoSQL injection key is detected
 */
function sanitizeValue(value, depth = 0) {
  // Prevent deeply nested payloads (DoS protection)
  if (depth > 10) return value;

  if (typeof value === 'string') {
    return stripHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      // Block NoSQL injection operators like $gt, $ne, $regex, etc.
      if (key.startsWith('$')) {
        throw new Error(`Invalid field name: "${key}"`);
      }
      sanitized[key] = sanitizeValue(value[key], depth + 1);
    }
    return sanitized;
  }

  return value;
}

/**
 * Express middleware that sanitizes req.body.
 */
export default function sanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = sanitizeValue(req.body);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid input detected.' });
    }
  }
  next();
}
