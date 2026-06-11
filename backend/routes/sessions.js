import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import auth from '../middleware/auth.js';
import { createSupabaseClient } from '../services/supabase.js';

const router = express.Router();

/** GET /api/sessions — list current user's sessions (for sidebar) */
router.get('/', auth, async (req, res) => {
  try {
    const supabase = createSupabaseClient(req.userJwt);
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('session_id, patient_name, disease, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    
    // Convert snake_case to camelCase for frontend compatibility
    const formatted = sessions.map(s => ({
      sessionId: s.session_id,
      patientName: s.patient_name,
      disease: s.disease,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[Sessions] List error:', err.message);
    res.status(500).json({ error: 'Failed to load sessions.' });
  }
});

/** GET /api/sessions/stats/overview — analytics for dashboard */
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const supabase = createSupabaseClient(req.userJwt);
    const userId = req.user.id;

    // Supabase allows us to count directly
    const { count: totalSessions, error: countError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('disease, created_at, updated_at, patient_name, messages')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const diseaseMap = {};
    let totalMessages = 0;

    sessions.forEach((s) => {
      const d = s.disease || 'General Query';
      diseaseMap[d] = (diseaseMap[d] || 0) + 1;
      // messages is a JSONB array
      totalMessages += (Array.isArray(s.messages) ? s.messages.length : 0);
    });

    const topDiseases = Object.entries(diseaseMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentSessions, error: recentError } = await supabase
      .from('sessions')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) throw recentError;

    const activityMap = {};
    recentSessions.forEach((s) => {
      const day = s.created_at.slice(0, 10);
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
      totalSessions: totalSessions || 0,
      totalMessages,
      topDiseases,
      activity,
      memberSince: sessions.length > 0 ? sessions[sessions.length - 1].created_at : new Date(),
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

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    const supabase = createSupabaseClient(req.userJwt);
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    res.json({
      sessionId: session.session_id,
      patientName: session.patient_name,
      disease: session.disease,
      location: session.location,
      age: session.age,
      gender: session.gender,
      messages: session.messages || [],
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    });
  } catch (err) {
    console.error('[Sessions] Get error:', err.message);
    res.status(500).json({ error: 'Failed to load session.' });
  }
});

/** POST /api/sessions — create a new session (user-scoped) */
router.post('/', auth, async (req, res) => {
  try {
    const { patientName, disease, location, age, gender } = req.body;
    const supabase = createSupabaseClient(req.userJwt);
    
    const newSession = {
      session_id: uuidv4(),
      user_id: req.user.id,
      patient_name: (patientName || '').slice(0, 200),
      disease: (disease || '').slice(0, 200),
      location: (location || '').slice(0, 200),
      age: (age || '').slice(0, 10),
      gender: (gender || '').slice(0, 20),
      messages: [],
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert([newSession])
      .select()
      .single();

    if (error) throw error;

    res.json({
      sessionId: data.session_id,
      patientName: data.patient_name,
      disease: data.disease,
      location: data.location,
      age: data.age,
      gender: data.gender,
      messages: data.messages,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error('[Sessions] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create session.' });
  }
});

/** PUT /api/sessions/:sessionId — rename a session */
router.put('/:sessionId', auth, async (req, res) => {
  try {
    const { disease, patientName } = req.body;
    const supabase = createSupabaseClient(req.userJwt);
    
    const updates = { updated_at: new Date().toISOString() };
    if (disease !== undefined) updates.disease = (disease || '').slice(0, 200);
    if (patientName !== undefined) updates.patient_name = (patientName || '').slice(0, 200);

    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('session_id', req.params.sessionId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return res.status(404).json({ error: 'Session not found.' });

    res.json({
      sessionId: data.session_id,
      patientName: data.patient_name,
      disease: data.disease,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error('[Sessions] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update session.' });
  }
});

/** DELETE /api/sessions/:sessionId — delete a session (user-scoped) */
router.delete('/:sessionId', auth, async (req, res) => {
  try {
    const supabase = createSupabaseClient(req.userJwt);
    const { count, error } = await supabase
      .from('sessions')
      .delete({ count: 'exact' })
      .eq('session_id', req.params.sessionId)
      .eq('user_id', req.user.id);

    if (error) throw error;
    if (count === 0) return res.status(404).json({ error: 'Session not found.' });

    res.json({ success: true });
  } catch (err) {
    console.error('[Sessions] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete session.' });
  }
});

/** POST /api/sessions/:sessionId/share — generate a share link for a session */
router.post('/:sessionId/share', auth, async (req, res) => {
  try {
    const { supabaseAdmin } = await import('../services/supabase.js');
    const shareToken = uuidv4();

    // Use admin client to bypass RLS, but still enforce ownership via user_id check
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update({ is_public: true, share_token: shareToken, updated_at: new Date().toISOString() })
      .eq('session_id', req.params.sessionId)
      .eq('user_id', req.user.id)
      .select('session_id, share_token')
      .single();

    if (error) {
      console.error('[Sessions] Share DB error:', JSON.stringify(error));
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Session not found.' });

    const frontendUrl = process.env.FRONTEND_URL || 'https://curalink-ten.vercel.app';
    res.json({
      shareToken: data.share_token,
      shareUrl: `${frontendUrl}/#/shared/${data.share_token}`,
    });
  } catch (err) {
    console.error('[Sessions] Share error:', err.message);
    res.status(500).json({ error: 'Failed to generate share link.' });
  }
});

/** DELETE /api/sessions/:sessionId/share — revoke a share link */
router.delete('/:sessionId/share', auth, async (req, res) => {
  try {
    const { supabaseAdmin } = await import('../services/supabase.js');

    const { error } = await supabaseAdmin
      .from('sessions')
      .update({ is_public: false, share_token: null, updated_at: new Date().toISOString() })
      .eq('session_id', req.params.sessionId)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[Sessions] Unshare error:', err.message);
    res.status(500).json({ error: 'Failed to revoke share link.' });
  }
});

/** GET /api/sessions/shared/:shareToken — public read-only view of a shared session */
router.get('/shared/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    if (!shareToken || typeof shareToken !== 'string' || shareToken.length > 100) {
      return res.status(400).json({ error: 'Invalid share token.' });
    }

    // Use admin client to bypass RLS for public sessions
    const { supabaseAdmin } = await import('../services/supabase.js');
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!session) return res.status(404).json({ error: 'Shared session not found or link has expired.' });

    res.json({
      sessionId: session.session_id,
      disease: session.disease,
      patientName: session.patient_name ? session.patient_name.charAt(0) + '***' : 'Anonymous', // Redact name for privacy
      messages: session.messages || [],
      createdAt: session.created_at,
      isShared: true,
    });
  } catch (err) {
    console.error('[Sessions] Shared view error:', err.message);
    res.status(500).json({ error: 'Failed to load shared session.' });
  }
});

export default router;
