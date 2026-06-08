import express from 'express';
import Bookmark from '../models/Bookmark.js';
import Session from '../models/Session.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/** GET /api/bookmarks — list user's bookmarks */
router.get('/', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(bookmarks);
  } catch (err) {
    console.error('[Bookmarks] List error:', err.message);
    res.status(500).json({ error: 'Failed to load bookmarks.' });
  }
});

/** POST /api/bookmarks — create a bookmark */
router.post('/', auth, async (req, res) => {
  try {
    const { sessionId, messageIndex, title, disease, preview } = req.body;

    if (!sessionId || messageIndex === undefined) {
      return res.status(400).json({ error: 'sessionId and messageIndex are required.' });
    }

    // Validate messageIndex is a non-negative integer
    const idx = parseInt(messageIndex, 10);
    if (isNaN(idx) || idx < 0) {
      return res.status(400).json({ error: 'messageIndex must be a non-negative integer.' });
    }

    // ── SECURITY: Verify the session belongs to the authenticated user ──
    const session = await Session.findOne({
      sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or access denied.' });
    }

    // Verify messageIndex is within bounds
    if (idx >= session.messages.length) {
      return res.status(400).json({ error: 'Invalid messageIndex — out of range.' });
    }

    const bookmark = new Bookmark({
      userId: req.user.id,
      sessionId,
      messageIndex: idx,
      title: (title || 'Untitled Research').slice(0, 200),
      disease: (disease || '').slice(0, 200),
      preview: (preview || '').slice(0, 500),
    });

    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This response is already bookmarked.' });
    }
    console.error('[Bookmarks] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create bookmark.' });
  }
});

/** DELETE /api/bookmarks/:id — remove a bookmark */
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Bookmark.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Bookmarks] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete bookmark.' });
  }
});

export default router;
