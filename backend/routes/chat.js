import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runResearchPipeline } from '../services/pipelineService.js';
import auth from '../middleware/auth.js';
import { createSupabaseClient } from '../services/supabase.js';

const router = express.Router();

const MAX_MESSAGE_LENGTH = 5000;
const MAX_FIELD_LENGTH = 200;

router.post('/', auth, async (req, res) => {
  try {
    const { message, sessionId, patientName, disease, location, age, gender } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` });
    }

    const safeStr = (val, maxLen = MAX_FIELD_LENGTH) => {
      if (val === undefined || val === null) return '';
      if (typeof val !== 'string') return '';
      return val.slice(0, maxLen).trim();
    };

    const safeName = safeStr(patientName);
    const safeDisease = safeStr(disease);
    const safeLocation = safeStr(location);
    const safeAge = safeStr(age, 10);
    const safeGender = safeStr(gender, 20);

    const supabase = createSupabaseClient(req.userJwt);
    let session;
    const sid = sessionId || uuidv4();

    if (sessionId) {
      if (typeof sessionId !== 'string' || sessionId.length > 100) {
        return res.status(400).json({ error: 'Invalid session ID.' });
      }
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', req.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      session = data;
    }

    if (!session) {
      session = {
        session_id: sid,
        user_id: req.user.id,
        patient_name: safeName,
        disease: safeDisease,
        location: safeLocation,
        age: safeAge,
        gender: safeGender,
        messages: [],
      };
    } else {
      if (patientName !== undefined) session.patient_name = safeName;
      if (disease !== undefined) session.disease = safeDisease;
      if (location !== undefined) session.location = safeLocation;
      if (age !== undefined) session.age = safeAge;
      if (gender !== undefined) session.gender = safeGender;
    }

    if (!Array.isArray(session.messages)) {
      session.messages = [];
    }

    session.messages.push({ role: 'user', content: message.trim(), timestamp: new Date().toISOString() });

    const result = await runResearchPipeline(message.trim(), {
      disease: session.disease,
      patientName: session.patient_name,
      location: session.location,
      age: session.age,
      gender: session.gender,
      conversationHistory: session.messages.slice(-8),
    });

    session.messages.push({
      role: 'assistant',
      content: result.llmResponse?.conditionOverview || 'Research completed.',
      metadata: {
        publications: result.publications,
        clinicalTrials: result.clinicalTrials,
        expandedQuery: result.expandedQuery,
        llmResponse: result.llmResponse,
        stats: result.stats,
      },
      timestamp: new Date().toISOString()
    });

    session.updated_at = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('sessions')
      .upsert([session], { onConflict: 'session_id' });

    if (upsertError) throw upsertError;

    res.json({
      sessionId: sid,
      result,
      sessionContext: {
        patientName: session.patient_name,
        disease: session.disease,
        location: session.location,
        age: session.age,
        gender: session.gender,
      },
    });
  } catch (err) {
    console.error('[Chat Route] Error:', err);
    res.status(500).json({ error: 'Research pipeline failed. Please try again.' });
  }
});

export default router;
