const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createConversation,
  getConversations,
  getConversationMessages,
  deleteConversation,
  askQuestion,
} = require('../controllers/conversation.controller');
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

router.use(verifyToken);

// POST /api/conversations - Create a new conversation
router.post('/', createConversation);

// GET /api/conversations - List user's conversations
router.get('/', getConversations);

// GET /api/conversations/:id - Get messages for a specific conversation
router.get('/:id', getConversationMessages);

// DELETE /api/conversations/:id - Delete a conversation
router.delete('/:id', deleteConversation);

// POST /api/conversations/:id/messages - Ask a question in a conversation (rate-limited)
router.post('/:id/messages', chatAskLimiter, askQuestion);

module.exports = router;
