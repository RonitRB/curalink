import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All session routes require authentication
router.use(authMiddleware);

/** GET /api/sessions — list sessions for logged-in user */
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find(
      { userId: req.userId },
      { sessionId: 1, patientName: 1, disease: 1, createdAt: 1, updatedAt: 1, 'messages': { $slice: 1 } }
    ).sort({ updatedAt: -1 }).limit(50);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/sessions/:sessionId — get full session (owned by user) */
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/sessions — create a new session for logged-in user */
router.post('/', async (req, res) => {
  try {
    const { patientName, disease, location } = req.body;
    const session = new Session({
      sessionId: uuidv4(),
      userId: req.userId,
      patientName: patientName || '',
      disease: disease || '',
      location: location || '',
      messages: [],
    });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/sessions/:sessionId — delete (owned by user only) */
router.delete('/:sessionId', async (req, res) => {
  try {
    await Session.deleteOne({ sessionId: req.params.sessionId, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
