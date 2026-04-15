import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';

const router = express.Router();

/** GET /api/sessions — list all sessions (for sidebar) */
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find(
      {},
      { sessionId: 1, patientName: 1, disease: 1, createdAt: 1, updatedAt: 1, 'messages': { $slice: 1 } }
    ).sort({ updatedAt: -1 }).limit(30);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/sessions/:sessionId — get full session with history */
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/sessions — create a new session */
router.post('/', async (req, res) => {
  try {
    const { patientName, disease, location } = req.body;
    const session = new Session({
      sessionId: uuidv4(),
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

/** DELETE /api/sessions/:sessionId — delete a session */
router.delete('/:sessionId', async (req, res) => {
  try {
    await Session.deleteOne({ sessionId: req.params.sessionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
