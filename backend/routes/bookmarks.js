import express from 'express';
import auth from '../middleware/auth.js';
import { createSupabaseClient } from '../services/supabase.js';

const router = express.Router();

/** GET /api/bookmarks — list user's bookmarks */
router.get('/', auth, async (req, res) => {
  try {
    const supabase = createSupabaseClient(req.userJwt);
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Format for frontend compatibility
    const formatted = bookmarks.map(b => ({
      _id: b.id, // Frontend expects _id for mongodb compatibility
      id: b.id,
      userId: b.user_id,
      sessionId: b.session_id,
      messageIndex: b.message_index,
      title: b.title,
      disease: b.disease,
      preview: b.preview,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    res.json(formatted);
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

    const idx = parseInt(messageIndex, 10);
    if (isNaN(idx) || idx < 0) {
      return res.status(400).json({ error: 'messageIndex must be a non-negative integer.' });
    }

    const supabase = createSupabaseClient(req.userJwt);

    // ── SECURITY: Verify the session belongs to the authenticated user ──
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('messages')
      .eq('session_id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') throw sessionError;
    if (!session) {
      return res.status(404).json({ error: 'Session not found or access denied.' });
    }

    // Verify messageIndex is within bounds
    const messages = session.messages || [];
    if (idx >= messages.length) {
      return res.status(400).json({ error: 'Invalid messageIndex — out of range.' });
    }

    const newBookmark = {
      user_id: req.user.id,
      session_id: sessionId,
      message_index: idx,
      title: (title || 'Untitled Research').slice(0, 200),
      disease: (disease || '').slice(0, 200),
      preview: (preview || '').slice(0, 500),
    };

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([newBookmark])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Postgres unique violation code
        return res.status(409).json({ error: 'This response is already bookmarked.' });
      }
      throw error;
    }

    res.status(201).json({
      _id: data.id,
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      messageIndex: data.message_index,
      title: data.title,
      disease: data.disease,
      preview: data.preview,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error('[Bookmarks] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create bookmark.' });
  }
});

/** DELETE /api/bookmarks/:id — remove a bookmark */
router.delete('/:id', auth, async (req, res) => {
  try {
    const supabase = createSupabaseClient(req.userJwt);
    const { count, error } = await supabase
      .from('bookmarks')
      .delete({ count: 'exact' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    if (count === 0) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Bookmarks] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete bookmark.' });
  }
});

export default router;
