import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import sessionRoutes from './routes/sessions.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

/* ── MongoDB — resilient connection with auto-retry ──────────── */
let dbReady = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || '';

  if (!uri || uri.includes('CHANGE_ME')) {
    console.error('⚠️  MONGODB_URI is not set. Open backend/.env and replace CHANGE_ME with your real Atlas connection string.');
    console.error('   Get one free at: https://cloud.mongodb.com');
    scheduleRetry();
    return;
  }

  try {
    await mongoose.connect(uri);
    dbReady = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Retrying in 10 seconds…');
    scheduleRetry();
  }
};

const scheduleRetry = () => setTimeout(connectDB, 10_000);

// Watch for disconnect events and reconnect automatically
mongoose.connection.on('disconnected', () => {
  dbReady = false;
  console.warn('⚡ MongoDB disconnected — reconnecting…');
  scheduleRetry();
});
mongoose.connection.on('connected', () => { dbReady = true; });

connectDB();

/* ── DB-readiness guard middleware ───────────────────────────── */
// Applied to protected routes so callers get a clear error instead of a crash
const requireDB = (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({
      error: 'Database not connected. Open backend/.env and add your real MONGODB_URI, then restart the server.',
    });
  }
  next();
};

/* ── Routes ──────────────────────────────────────────────────── */
app.use('/api/auth',     requireDB, authRoutes);
app.use('/api/chat',     requireDB, chatRoutes);
app.use('/api/sessions', requireDB, sessionRoutes);

/* ── Health check (always responds, even without DB) ─────────── */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'Curalink API',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Curalink API running on port ${PORT}`);
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('CHANGE_ME')) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ACTION REQUIRED — backend/.env is missing credentials');
    console.log('');
    console.log('  1. Go to https://cloud.mongodb.com');
    console.log('     → "Connect" → "Drivers" → copy the URI');
    console.log('     → paste it as MONGODB_URI in backend/.env');
    console.log('');
    console.log('  2. Go to https://console.groq.com');
    console.log('     → copy your API key');
    console.log('     → paste it as GROQ_API_KEY in backend/.env');
    console.log('');
    console.log('  The server will reconnect automatically once set.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
});
