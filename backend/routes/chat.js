import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';
import { runResearchPipeline } from '../services/pipelineService.js';

const router = express.Router();

/**
 * POST /api/chat
 * Main endpoint — runs the full AI research pipeline and returns structured results.
 *
 * Body:
 * {
 *   message: string,          // User's question
 *   sessionId?: string,       // Existing session ID for multi-turn
 *   patientName?: string,     // Patient name context
 *   disease?: string,         // Primary disease/condition
 *   location?: string         // Patient location
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId, patientName, disease, location } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Resolve or create session
    let session;
    const sid = sessionId || uuidv4();

    if (sessionId) {
      session = await Session.findOne({ sessionId });
    }

    if (!session) {
      session = new Session({
        sessionId: sid,
        patientName: patientName || '',
        disease: disease || '',
        location: location || '',
        messages: [],
      });
    }

    // Update context if new values provided
    if (patientName !== undefined) session.patientName = patientName;
    if (disease !== undefined) session.disease = disease;
    if (location !== undefined) session.location = location;

    // Store user message
    session.messages.push({ role: 'user', content: message });

    // Run the AI pipeline
    const result = await runResearchPipeline(message, {
      disease: session.disease,
      patientName: session.patientName,
      location: session.location,
      conversationHistory: session.messages.slice(-8),
    });

    // Store assistant response with full metadata
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
    });

    session.updatedAt = new Date();
    await session.save();

    res.json({
      sessionId: sid,
      result,
      sessionContext: {
        patientName: session.patientName,
        disease: session.disease,
        location: session.location,
      },
    });
  } catch (err) {
    console.error('[Chat Route] Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

export default router;
