import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/** GET /api/sessions — list current user's sessions (for sidebar) */
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find(
      { userId: req.user.id },
      { sessionId: 1, patientName: 1, disease: 1, createdAt: 1, updatedAt: 1, 'messages': { $slice: 1 } }
    ).sort({ updatedAt: -1 }).limit(30);
    res.json(sessions);
  } catch (err) {
    console.error('[Sessions] List error:', err.message);
    res.status(500).json({ error: 'Failed to load sessions.' });
  }
});

/** GET /api/sessions/stats/overview — analytics for dashboard */
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalSessions, sessions] = await Promise.all([
      Session.countDocuments({ userId }),
      Session.find({ userId }, {
        disease: 1, createdAt: 1, updatedAt: 1, patientName: 1,
        'messages': { $slice: -1 },
      }).sort({ updatedAt: -1 }).limit(100),
    ]);

    const diseaseMap = {};
    let totalMessages = 0;

    sessions.forEach((s) => {
      const d = s.disease || 'General Query';
      diseaseMap[d] = (diseaseMap[d] || 0) + 1;
      totalMessages += s.messages?.length || 0;
    });

    const topDiseases = Object.entries(diseaseMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSessions = await Session.find(
      { userId, createdAt: { $gte: thirtyDaysAgo } },
      { createdAt: 1 }
    );

    const activityMap = {};
    recentSessions.forEach((s) => {
      const day = s.createdAt.toISOString().slice(0, 10);
      activityMap[day] = (activityMap[day] || 0) + 1;
    });

    const activity = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      activity.push({ date: key, count: activityMap[key] || 0 });
    }

    res.json({
      totalSessions,
      totalMessages,
      topDiseases,
      activity,
      memberSince: sessions.length > 0 ? sessions[sessions.length - 1].createdAt : new Date(),
    });
  } catch (err) {
    console.error('[Sessions] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

/** GET /api/sessions/:sessionId — get full session with history (user-scoped) */
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    const session = await Session.findOne({
      sessionId,
      userId: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json(session);
  } catch (err) {
    console.error('[Sessions] Get error:', err.message);
    res.status(500).json({ error: 'Failed to load session.' });
  }
});

/** POST /api/sessions — create a new session (user-scoped) */
router.post('/', auth, async (req, res) => {
  try {
    const { patientName, disease, location, age, gender } = req.body;
    const session = new Session({
      sessionId: uuidv4(),
      userId: req.user.id,
      patientName: (patientName || '').slice(0, 200),
      disease: (disease || '').slice(0, 200),
      location: (location || '').slice(0, 200),
      age: (age || '').slice(0, 10),
      gender: (gender || '').slice(0, 20),
      messages: [],
    });
    await session.save();
    res.json(session);
  } catch (err) {
    console.error('[Sessions] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create session.' });
  }
});

/** PUT /api/sessions/:sessionId — rename a session */
router.put('/:sessionId', auth, async (req, res) => {
  try {
    const { disease, patientName } = req.body;
    const session = await Session.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    if (disease !== undefined) session.disease = (disease || '').slice(0, 200);
    if (patientName !== undefined) session.patientName = (patientName || '').slice(0, 200);
    await session.save();
    res.json(session);
  } catch (err) {
    console.error('[Sessions] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update session.' });
  }
});

/** DELETE /api/sessions/:sessionId — delete a session (user-scoped) */
router.delete('/:sessionId', auth, async (req, res) => {
  try {
    const result = await Session.deleteOne({
      sessionId: req.params.sessionId,
      userId: req.user.id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Sessions] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete session.' });
  }
});

export default router;
