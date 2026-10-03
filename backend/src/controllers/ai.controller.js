const axios = require('axios');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Forward POST /api/ai/ingest → FastAPI POST /api/ingest
 * Expected body: { file_path, file_type, document_id }
 */
const ingestDocument = async (req, res, next) => {
  try {
    const response = await axios.post(`${RAG_SERVICE_URL}/api/ingest`, req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    return handleProxyError(error, next);
  }
};

/**
 * Forward POST /api/ai/chat → FastAPI POST /api/chat
 * Expected body: { question }
 */
const chat = async (req, res, next) => {
  try {
    const response = await axios.post(`${RAG_SERVICE_URL}/api/chat`, req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    return handleProxyError(error, next);
  }
};

/**
 * Converts axios proxy errors into structured Express errors.
 * - If the Python service replied with an error, forward its status + body.
 * - If the Python service is unreachable, return 502 Bad Gateway.
 */
function handleProxyError(error, next) {
  if (error.response) {
    // FastAPI responded with a non-2xx status — relay it as-is
    const proxyErr = new Error(
      error.response.data?.detail || error.response.data?.message || 'RAG service error'
    );
    proxyErr.statusCode = error.response.status;
    return next(proxyErr);
  }

  if (error.request) {
    // Request was made but no response received (service is down / unreachable)
    const gatewayErr = new Error(
      'RAG service is unavailable. Please try again later.'
    );
    gatewayErr.statusCode = 502;
    return next(gatewayErr);
  }

  // Unexpected error building the request
  return next(error);
}

module.exports = { ingestDocument, chat };
