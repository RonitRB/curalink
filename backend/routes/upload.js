import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import auth from '../middleware/auth.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configure multer for in-memory file storage (ephemeral processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a PDF, JPEG, PNG, or TXT file.'));
    }
  },
});

/**
 * POST /api/upload
 * Upload a medical document (PDF, image, text) and extract its text content.
 * The extracted text can then be passed into the research pipeline as additional context.
 */
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { mimetype, buffer, originalname } = req.file;
    let extractedText = '';

    if (mimetype === 'application/pdf') {
      // Extract text from PDF
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
    } else if (mimetype === 'text/plain') {
      // Plain text file
      extractedText = buffer.toString('utf-8');
    } else if (mimetype.startsWith('image/')) {
      // For images, we return a note that OCR is not yet available
      // In a future iteration, this could integrate Groq Vision or Tesseract.js
      extractedText = '[Image uploaded — text extraction from images is coming soon. Please upload a PDF or text file for now.]';
    }

    // Truncate to a reasonable length for LLM context
    const maxLength = 4000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.slice(0, maxLength) + '\n\n[... document truncated for processing ...]';
    }

    // Clean up whitespace
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    console.log(`[Upload] Processed ${originalname} (${mimetype}): ${extractedText.length} chars extracted`);

    res.json({
      success: true,
      filename: originalname,
      mimetype,
      extractedText,
      charCount: extractedText.length,
    });
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    if (err.message?.includes('Unsupported file type')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to process uploaded file.' });
  }
});

export default router;
