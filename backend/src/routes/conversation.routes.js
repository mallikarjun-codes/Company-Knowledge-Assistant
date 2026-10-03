const express = require('express');
const {
  createConversation,
  getConversations,
  getConversationMessages,
  deleteConversation,
  askQuestion,
} = require('../controllers/conversation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(verifyToken);

// POST /api/conversations - Create a new conversation
router.post('/', createConversation);

// GET /api/conversations - List user's conversations
router.get('/', getConversations);

// GET /api/conversations/:id - Get messages for a specific conversation
router.get('/:id', getConversationMessages);

// DELETE /api/conversations/:id - Delete a conversation
router.delete('/:id', deleteConversation);

// POST /api/conversations/:id/messages - Ask a question in a conversation
router.post('/:id/messages', askQuestion);

module.exports = router;
