const chatService = require('../services/chat.service');

const ask = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim() || question.trim().length > 1000) {
      const error = new Error('Question must be between 1 and 1000 characters');
      error.statusCode = 400;
      throw error;
    }

    const result = await chatService.askQuestion(req.user.id, question.trim());

    res.status(200).json({
      answer: result.answer,
      sources: result.sources,
      // Also return message IDs and metadata if consumer needs it
      messageId: result.aiMessage.id,
      createdAt: result.aiMessage.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await chatService.getChatHistory(req.user.id);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ask,
  getHistory,
};
