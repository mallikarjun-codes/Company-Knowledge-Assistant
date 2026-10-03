const axios = require('axios');
const db = require('../config/db');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Get or create the active conversation for a user (Legacy).
 */
async function getOrCreateActiveConversation(userId, defaultTitle = 'New Conversation') {
  const existing = await db.query(
    'SELECT id FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [userId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const created = await db.query(
    'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id',
    [userId, defaultTitle.substring(0, 50)]
  );

  return created.rows[0].id;
}

/**
 * Create a new conversation explicitly.
 */
async function createConversation(userId) {
  const created = await db.query(
    `INSERT INTO conversations (user_id, title) VALUES ($1, 'New Conversation') RETURNING id, title, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [userId]
  );
  return created.rows[0];
}

/**
 * Get all conversations for a user.
 */
async function getConversations(userId) {
  const res = await db.query(
    `SELECT id, title, created_at AS "createdAt", updated_at AS "updatedAt" 
     FROM conversations 
     WHERE user_id = $1 
     ORDER BY updated_at DESC`,
    [userId]
  );
  return res.rows;
}

/**
 * Delete a conversation.
 */
async function deleteConversation(userId, conversationId) {
  const res = await db.query(
    'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
    [conversationId, userId]
  );
  if (res.rowCount === 0) {
    const err = new Error('Conversation not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }
}


/**
 * Handle user question:
 * 1. Persist user message to DB
 * 2. Query RAG service
 * 3. Persist AI message and citations/sources to DB
 */
async function askQuestion(userId, question) {
  const conversationId = await getOrCreateActiveConversation(userId, question);

  // 1. Save user question
  const userMsgResult = await db.query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, 'user', $2)
     RETURNING id, role, content, created_at AS "createdAt"`,
    [conversationId, question]
  );
  const userMessage = userMsgResult.rows[0];

  // 2. Query RAG service
  let answer = '';
  let rawSources = [];

  try {
    const ragResponse = await axios.post(`${RAG_SERVICE_URL}/api/chat`, { question });
    answer = ragResponse.data?.answer || '';
    rawSources = ragResponse.data?.sources || [];
  } catch (error) {
    if (error.response) {
      const err = new Error(
        error.response.data?.detail || error.response.data?.message || 'RAG service error'
      );
      err.statusCode = error.response.status;
      throw err;
    }
    if (error.request) {
      const err = new Error('RAG service is unavailable. Please try again later.');
      err.statusCode = 502;
      throw err;
    }
    throw error;
  }

  // 3. Save AI message
  const aiMsgResult = await db.query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, 'ai', $2)
     RETURNING id, role, content, created_at AS "createdAt"`,
    [conversationId, answer]
  );
  const aiMessage = aiMsgResult.rows[0];

  // Update conversation timestamp
  await db.query(
    'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [conversationId]
  );

  // 4. Save message sources if any
  const savedSources = [];
  if (Array.isArray(rawSources) && rawSources.length > 0) {
    for (const src of rawSources) {
      const rawDocId = src.documentId || src.document_id || null;
      let validDocId = null;
      let docName = src.documentName || src.document_name || src.filename || null;
      if (rawDocId) {
        try {
          const docRow = await db.query('SELECT id, original_name FROM documents WHERE id = $1', [rawDocId]);
          if (docRow.rows.length > 0) {
            validDocId = docRow.rows[0].id;
            if (!docName) {
              docName = docRow.rows[0].original_name;
            }
          }
        } catch (_) {}
      }

      const contentSnippet = src.contentSnippet || src.content_snippet || src.content || src.snippet || '';
      const similarityScore = src.similarityScore ?? src.similarity_score ?? src.score ?? null;

      const srcResult = await db.query(
        `INSERT INTO message_sources (message_id, document_id, document_name, content_snippet, similarity_score)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, document_id, document_name, content_snippet, similarity_score`,
        [aiMessage.id, validDocId, docName, contentSnippet, similarityScore]
      );

      savedSources.push({
        documentName: docName || 'Document',
        contentSnippet,
        similarityScore: similarityScore != null ? Number(similarityScore) : null,
      });
    }
  }

  return {
    answer,
    sources: savedSources,
    userMessage,
    aiMessage: {
      ...aiMessage,
      sources: savedSources,
    },
  };
}

/**
 * Get structured chat history for the user's most recent conversation.
 * Returns up to the last 50 messages, ordered oldest-first.
 */
async function getChatHistory(userId) {
  const convRes = await db.query(
    'SELECT id FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [userId]
  );

  if (convRes.rows.length === 0) {
    return [];
  }

  const conversationId = convRes.rows[0].id;

  // Retrieve the latest 50 messages ordered chronologically (oldest-first)
  const messagesRes = await db.query(
    `SELECT * FROM (
       SELECT id, role, content, created_at AS "createdAt"
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 50
     ) sub
     ORDER BY "createdAt" ASC`,
    [conversationId]
  );

  const messages = messagesRes.rows;
  if (messages.length === 0) {
    return [];
  }

  const messageIds = messages.map((m) => m.id);

  // Fetch all sources for these messages
  const sourcesRes = await db.query(
    `SELECT 
       ms.message_id,
       COALESCE(d.original_name, d.filename, ms.document_name, 'Unknown document') AS "documentName",
       ms.content_snippet AS "contentSnippet",
       ms.similarity_score AS "similarityScore"
     FROM message_sources ms
     LEFT JOIN documents d ON ms.document_id = d.id
     WHERE ms.message_id = ANY($1::uuid[])
     ORDER BY ms.id ASC`,
    [messageIds]
  );

  const sourcesByMsgId = {};
  for (const row of sourcesRes.rows) {
    if (!sourcesByMsgId[row.message_id]) {
      sourcesByMsgId[row.message_id] = [];
    }
    sourcesByMsgId[row.message_id].push({
      documentName: row.documentName,
      contentSnippet: row.contentSnippet,
      similarityScore: row.similarityScore != null ? Number(row.similarityScore) : null,
    });
  }

  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
    sources: sourcesByMsgId[msg.id] || [],
  }));
}

/**
 * Ask a question in a specific conversation.
 */
async function askQuestionInConversation(userId, conversationId, question) {
  // Verify conversation belongs to user
  const convRes = await db.query(
    'SELECT id, title FROM conversations WHERE id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (convRes.rows.length === 0) {
    const err = new Error('Conversation not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }
  const conversation = convRes.rows[0];

  // Update title if it's new
  if (conversation.title === 'New Conversation') {
    const newTitle = question.substring(0, 50);
    await db.query('UPDATE conversations SET title = $1 WHERE id = $2', [newTitle, conversationId]);
  }

  // 1. Save user question
  const userMsgResult = await db.query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, 'user', $2)
     RETURNING id, role, content, created_at AS "createdAt"`,
    [conversationId, question]
  );
  const userMessage = userMsgResult.rows[0];

  // 2. Query RAG service
  let answer = '';
  let rawSources = [];

  try {
    const ragResponse = await axios.post(`${RAG_SERVICE_URL}/api/chat`, { question });
    answer = ragResponse.data?.answer || '';
    rawSources = ragResponse.data?.sources || [];
  } catch (error) {
    if (error.response) {
      const err = new Error(
        error.response.data?.detail || error.response.data?.message || 'RAG service error'
      );
      err.statusCode = error.response.status;
      throw err;
    }
    if (error.request) {
      const err = new Error('RAG service is unavailable. Please try again later.');
      err.statusCode = 502;
      throw err;
    }
    throw error;
  }

  // 3. Save AI message
  const aiMsgResult = await db.query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, 'ai', $2)
     RETURNING id, role, content, created_at AS "createdAt"`,
    [conversationId, answer]
  );
  const aiMessage = aiMsgResult.rows[0];

  // Update conversation timestamp
  await db.query(
    'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [conversationId]
  );

  // 4. Save message sources if any
  const savedSources = [];
  if (Array.isArray(rawSources) && rawSources.length > 0) {
    for (const src of rawSources) {
      const rawDocId = src.documentId || src.document_id || null;
      let validDocId = null;
      let docName = src.documentName || src.document_name || src.filename || null;
      if (rawDocId) {
        try {
          const docRow = await db.query('SELECT id, original_name FROM documents WHERE id = $1', [rawDocId]);
          if (docRow.rows.length > 0) {
            validDocId = docRow.rows[0].id;
            if (!docName) {
              docName = docRow.rows[0].original_name;
            }
          }
        } catch (_) {}
      }

      const contentSnippet = src.contentSnippet || src.content_snippet || src.content || src.snippet || '';
      const similarityScore = src.similarityScore ?? src.similarity_score ?? src.score ?? null;

      const srcResult = await db.query(
        `INSERT INTO message_sources (message_id, document_id, document_name, content_snippet, similarity_score)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, document_id, document_name, content_snippet, similarity_score`,
        [aiMessage.id, validDocId, docName, contentSnippet, similarityScore]
      );

      savedSources.push({
        documentName: docName || 'Document',
        contentSnippet,
        similarityScore: similarityScore != null ? Number(similarityScore) : null,
      });
    }
  }

  return {
    answer,
    sources: savedSources,
    userMessage,
    aiMessage: {
      ...aiMessage,
      sources: savedSources,
    },
  };
}

/**
 * Get messages for a specific conversation.
 */
async function getConversationMessagesById(userId, conversationId) {
  const convRes = await db.query(
    'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (convRes.rows.length === 0) {
    const err = new Error('Conversation not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  const messagesRes = await db.query(
    `SELECT * FROM (
       SELECT id, role, content, created_at AS "createdAt"
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 50
     ) sub
     ORDER BY "createdAt" ASC`,
    [conversationId]
  );

  const messages = messagesRes.rows;
  if (messages.length === 0) {
    return [];
  }

  const messageIds = messages.map((m) => m.id);

  // Fetch all sources for these messages
  const sourcesRes = await db.query(
    `SELECT 
       ms.message_id,
       COALESCE(d.original_name, d.filename, ms.document_name, 'Unknown document') AS "documentName",
       ms.content_snippet AS "contentSnippet",
       ms.similarity_score AS "similarityScore"
     FROM message_sources ms
     LEFT JOIN documents d ON ms.document_id = d.id
     WHERE ms.message_id = ANY($1::uuid[])
     ORDER BY ms.id ASC`,
    [messageIds]
  );

  const sourcesByMsgId = {};
  for (const row of sourcesRes.rows) {
    if (!sourcesByMsgId[row.message_id]) {
      sourcesByMsgId[row.message_id] = [];
    }
    sourcesByMsgId[row.message_id].push({
      documentName: row.documentName,
      contentSnippet: row.contentSnippet,
      similarityScore: row.similarityScore != null ? Number(row.similarityScore) : null,
    });
  }

  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
    sources: sourcesByMsgId[msg.id] || [],
  }));
}

module.exports = {
  getOrCreateActiveConversation,
  askQuestion,
  getChatHistory,
  createConversation,
  getConversations,
  deleteConversation,
  askQuestionInConversation,
  getConversationMessagesById,
};
