const chatService = require('../services/chat.service');

const createConversation = async (req, res, next) => {
  try {
    const conversation = await chatService.createConversation(req.user.id);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const messages = await chatService.getConversationMessagesById(req.user.id, id);
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await chatService.deleteConversation(req.user.id, id);
    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const askQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      const error = new Error('Question is required');
      error.statusCode = 400;
      throw error;
    }

    const result = await chatService.askQuestionInConversation(req.user.id, id, question.trim());

    res.status(200).json({
      answer: result.answer,
      sources: result.sources,
      messageId: result.aiMessage.id,
      createdAt: result.aiMessage.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationMessages,
  deleteConversation,
  askQuestion,
};
