import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';
import { runResearchPipeline } from '../services/pipelineService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Input constraints
const MAX_MESSAGE_LENGTH = 5000;
const MAX_FIELD_LENGTH = 200;

/**
 * POST /api/chat
 * Main endpoint — runs the full AI research pipeline and returns structured results.
 * Requires authentication. Sessions are scoped to the authenticated user.
 *
 * Body:
 * {
 *   message: string,          // User's question (max 5000 chars)
 *   sessionId?: string,       // Existing session ID for multi-turn
 *   patientName?: string,     // Patient name context
 *   disease?: string,         // Primary disease/condition
 *   location?: string,        // Patient location
 *   age?: string,             // Patient age
 *   gender?: string           // Patient gender
 * }
 */
router.post('/', auth, async (req, res) => {
  try {
    const { message, sessionId, patientName, disease, location, age, gender } = req.body;

    // ── Input validation ──────────────────────────────────────
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` });
    }

    // Validate optional string fields
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

    // ── Resolve or create session (user-scoped) ───────────────
    let session;
    const sid = sessionId || uuidv4();

    if (sessionId) {
      if (typeof sessionId !== 'string' || sessionId.length > 100) {
        return res.status(400).json({ error: 'Invalid session ID.' });
      }
      session = await Session.findOne({ sessionId, userId: req.user.id });
    }

    if (!session) {
      session = new Session({
        sessionId: sid,
        userId: req.user.id,
        patientName: safeName,
        disease: safeDisease,
        location: safeLocation,
        age: safeAge,
        gender: safeGender,
        messages: [],
      });
    }

    // Update context if new values provided
    if (patientName !== undefined) session.patientName = safeName;
    if (disease !== undefined) session.disease = safeDisease;
    if (location !== undefined) session.location = safeLocation;
    if (age !== undefined) session.age = safeAge;
    if (gender !== undefined) session.gender = safeGender;

    // Store user message
    session.messages.push({ role: 'user', content: message.trim() });

    // Run the AI pipeline
    const result = await runResearchPipeline(message.trim(), {
      disease: session.disease,
      patientName: session.patientName,
      location: session.location,
      age: session.age,
      gender: session.gender,
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
