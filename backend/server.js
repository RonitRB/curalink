import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import sessionRoutes from './routes/sessions.js';
import bookmarkRoutes from './routes/bookmarks.js';
import sanitize from './middleware/sanitize.js';
import { apiLimiter, chatLimiter } from './middleware/rateLimit.js';

dotenv.config();

// ── Startup validation — fail fast if critical env vars are missing ──
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GROQ_API_KEY'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security headers ──────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  // Remove X-Powered-By header to avoid exposing Express
  res.removeHeader('X-Powered-By');
  next();
});

// ── CORS — require explicit FRONTEND_URL ──────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  console.warn('⚠️  WARNING: FRONTEND_URL not set. CORS will reject cross-origin requests.');
}

app.use(cors({
  origin: FRONTEND_URL || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // Preflight cache: 24 hours
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));

// ── Input sanitization (applied to all routes) ────────────────
app.use(sanitize);

// ── Request logger ────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// ── Routes (with rate limiters) ───────────────────────────────
// Auth routes removed, handled directly by Supabase on the frontend
app.use('/api/chat', apiLimiter, chatLimiter, chatRoutes);
app.use('/api/sessions', apiLimiter, sessionRoutes);
app.use('/api/bookmarks', apiLimiter, bookmarkRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Curalink API (Supabase)',
    version: '2.1.0',
  });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  // Never expose internal error details to the client
  res.status(500).json({ error: 'Internal server error. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Curalink API v2.1 running on port ${PORT}`);
  console.log(`   Security: headers ✓ | rate-limit ✓ | sanitize ✓ | CORS: ${FRONTEND_URL || 'BLOCKED'}`);
});
