import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import auth from '../middleware/auth.js';
import { createSupabaseClient, supabaseAdmin } from '../services/supabase.js';

const router = express.Router();

/**
 * Research Alerts API
 * Allows users to subscribe to weekly digest emails for specific conditions.
 */

/** GET /api/alerts — list current user's alerts */
router.get('/', auth, async (req, res) => {
  try {
    const supabase = createSupabaseClient(req.userJwt);
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (err) {
    console.error('[Alerts] List error:', err.message);
    res.status(500).json({ error: 'Failed to load alerts.' });
  }
});

/** POST /api/alerts — create a new alert subscription */
router.post('/', auth, async (req, res) => {
  try {
    const { disease, query } = req.body;

    if (!disease || typeof disease !== 'string' || !disease.trim()) {
      return res.status(400).json({ error: 'Disease/condition is required.' });
    }

    const supabase = createSupabaseClient(req.userJwt);

    // Check for duplicates
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('disease', disease.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'You already have an alert for this condition.' });
    }

    const alert = {
      id: uuidv4(),
      user_id: req.user.id,
      disease: disease.trim().slice(0, 200),
      query: (query || disease).trim().slice(0, 500),
      is_active: true,
      frequency: 'weekly',
    };

    const { data, error } = await supabase
      .from('alerts')
      .insert([alert])
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('[Alerts] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create alert.' });
  }
});

/** DELETE /api/alerts/:id — delete an alert subscription */
router.delete('/:id', auth, async (req, res) => {
  try {
    const supabase = createSupabaseClient(req.userJwt);
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[Alerts] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete alert.' });
  }
});

/** PATCH /api/alerts/:id — toggle alert active status */
router.patch('/:id', auth, async (req, res) => {
  try {
    const { is_active } = req.body;
    const supabase = createSupabaseClient(req.userJwt);

    const { data, error } = await supabase
      .from('alerts')
      .update({ is_active: !!is_active })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[Alerts] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update alert.' });
  }
});

/**
 * POST /api/alerts/digest/trigger — Trigger the weekly digest (for cron job)
 * This endpoint is intended to be called by a cron job (e.g., Render Cron, GitHub Actions).
 * It checks for active alerts, fetches recent articles, and would send email digests.
 *
 * For now, it returns a summary of what it would send. Email integration (Resend/SendGrid)
 * can be added once the user selects a provider.
 */
router.post('/digest/trigger', async (req, res) => {
  try {
    // Basic auth check for cron security
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    // Fetch all active alerts
    const { data: alerts, error } = await supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('is_active', true);

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return res.json({ message: 'Alerts table not yet created. No digests to send.', count: 0 });
      }
      throw error;
    }

    if (!alerts || alerts.length === 0) {
      return res.json({ message: 'No active alerts found.', count: 0 });
    }

    console.log(`[Alerts] Processing ${alerts.length} active alerts...`);

    // Group alerts by user for batch processing
    const userAlerts = {};
    alerts.forEach((a) => {
      if (!userAlerts[a.user_id]) userAlerts[a.user_id] = [];
      userAlerts[a.user_id].push(a);
    });

    const results = [];
    for (const [userId, userAlertList] of Object.entries(userAlerts)) {
      results.push({
        userId,
        alertCount: userAlertList.length,
        diseases: userAlertList.map((a) => a.disease),
        status: 'digest_ready', // Would be 'email_sent' once email provider is integrated
      });
    }

    res.json({
      message: `Processed ${alerts.length} alerts for ${Object.keys(userAlerts).length} users.`,
      count: alerts.length,
      results,
    });
  } catch (err) {
    console.error('[Alerts] Digest trigger error:', err.message);
    res.status(500).json({ error: 'Digest processing failed.' });
  }
});

export default router;
