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
    const { message, sessionId, patientName, disease, location, age, gender, medications, documentContext, language } = req.body;

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
      medications: Array.isArray(medications) ? medications.filter((m) => typeof m === 'string').slice(0, 10) : [],
      documentContext: typeof documentContext === 'string' ? documentContext.slice(0, 4000) : '',
      language: typeof language === 'string' ? language.slice(0, 30) : 'English',
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

/** POST /api/chat/summarize — lightweight single-publication summarizer */
router.post('/summarize', auth, async (req, res) => {
  try {
    const { title, abstract } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Publication title is required.' });
    }
    if (!abstract || typeof abstract !== 'string') {
      return res.status(400).json({ error: 'Publication abstract is required.' });
    }

    const { callLLM } = await import('../services/llmService.js');

    const rawSummary = await callLLM(
      [
        {
          role: 'system',
          content: 'You are a medical research summarizer. Given a publication title and abstract, provide a concise, plain-language summary in 2-3 sentences. Focus on the key findings, methodology, and clinical implications. Do NOT use any markdown formatting. Write in clear, professional language accessible to healthcare professionals.',
        },
        {
          role: 'user',
          content: `Title: "${title.slice(0, 500)}"\n\nAbstract: "${abstract.slice(0, 1500)}"`,
        },
      ],
      { temperature: 0.3, maxTokens: 300 }
    );

    res.json({ summary: rawSummary.trim() });
  } catch (err) {
    console.error('[Chat Route] Summarize error:', err.message);
    res.status(500).json({ error: 'Failed to summarize publication.' });
  }
});

export default router;
