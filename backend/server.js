require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth.routes');
const documentRoutes = require('./src/routes/document.routes');
const aiRoutes = require('./src/routes/ai.routes');
const chatRoutes = require('./src/routes/chat.routes');
const conversationRoutes = require('./src/routes/conversation.routes');
const errorHandler = require('./src/middlewares/error.middleware');

const app = express();

// ── Security Headers (must be FIRST) ─────────────────────────────────────────
app.use(helmet());

// ── Rate Limiters ─────────────────────────────────────────────────────────────

// Auth routes: 10 requests per 15 minutes per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
});

// General API limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
});

// ── General Middlewares ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Apply general limiter to all /api routes
app.use('/api', generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// ── Global Error Handler (must be LAST) ──────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
