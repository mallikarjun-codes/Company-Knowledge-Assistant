const express = require('express');
const rateLimit = require('express-rate-limit');
const { ask, getHistory } = require('../controllers/chat.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// 30 requests per minute per authenticated user (LLM cost protection)
const chatAskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id?.toString() || req.ip,
  message: { error: 'Too many chat requests. Please wait a moment before asking again.' },
});

// POST /api/chat/ask - Ask a question, retrieve answer from RAG, persist user/ai messages & sources
router.post('/ask', verifyToken, chatAskLimiter, ask);

// GET /api/chat/history - Retrieve structured message history for the active conversation
router.get('/history', verifyToken, getHistory);

module.exports = router;
