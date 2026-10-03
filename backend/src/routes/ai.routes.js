const express = require('express');
const { ingestDocument, chat } = require('../controllers/ai.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// POST /api/ai/ingest - Forward document ingestion request to FastAPI RAG service
router.post('/ingest', verifyToken, ingestDocument);

// POST /api/ai/chat - Forward chat/question request to FastAPI RAG service
router.post('/chat', verifyToken, chat);

module.exports = router;
