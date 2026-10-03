const express = require('express');
const { ask, getHistory } = require('../controllers/chat.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// POST /api/chat/ask - Ask a question, retrieve answer from RAG, persist user/ai messages & sources
router.post('/ask', verifyToken, ask);

// GET /api/chat/history - Retrieve structured message history for the active conversation
router.get('/history', verifyToken, getHistory);

module.exports = router;
