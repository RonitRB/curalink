/**
 * In-memory rate limiter middleware.
 * No external dependencies — uses a simple sliding-window counter per IP.
 *
 * Usage:
 *   import { authLimiter, apiLimiter } from './middleware/rateLimit.js';
 *   app.use('/api/auth', authLimiter);
 *   app.use('/api', apiLimiter);
 */

class RateLimiter {
  constructor({ windowMs = 60_000, max = 30, message = 'Too many requests. Please try again later.' }) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    /** @type {Map<string, { count: number, resetTime: number }>} */
    this.store = new Map();

    // Cleanup expired entries every 5 minutes to prevent memory leaks
    this._cleanupInterval = setInterval(() => this._cleanup(), 5 * 60_000);
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  _getKey(req) {
    // Use X-Forwarded-For in production (behind reverse proxy), fallback to remoteAddress
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  }

  middleware() {
    return (req, res, next) => {
      const key = this._getKey(req);
      const now = Date.now();
      let entry = this.store.get(key);

      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + this.windowMs };
        this.store.set(key, entry);
      }

      entry.count++;

      // Set rate limit headers
      const remaining = Math.max(0, this.max - entry.count);
      res.set('X-RateLimit-Limit', String(this.max));
      res.set('X-RateLimit-Remaining', String(remaining));
      res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

      if (entry.count > this.max) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ error: this.message });
      }

      next();
    };
  }
}

// Auth routes: 5 requests per minute (brute-force protection)
export const authLimiter = new RateLimiter({
  windowMs: 60_000,
  max: 5,
  message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
}).middleware();

// General API routes: 30 requests per minute
export const apiLimiter = new RateLimiter({
  windowMs: 60_000,
  max: 30,
  message: 'Too many requests. Please slow down and try again shortly.',
}).middleware();

// Chat/research pipeline: 10 requests per minute (expensive LLM calls)
export const chatLimiter = new RateLimiter({
  windowMs: 60_000,
  max: 10,
  message: 'Too many research requests. Please wait before submitting another query.',
}).middleware();
