const path = require('path');
const axios = require('axios');
const db = require('../config/db');
const documentService = require('../services/document.service');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000';

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.statusCode = 400;
      throw error;
    }

    const doc = await documentService.createDocument({
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      uploadedBy: req.user.id
    });

    // Ingest into RAG service
    try {
      let filePathForRag = path.resolve(doc.file_path).replace(/\\/g, '/');
      if (/^[a-zA-Z]:\//.test(filePathForRag)) {
        const drive = filePathForRag[0].toLowerCase();
        filePathForRag = `/mnt/${drive}${filePathForRag.slice(2)}`;
      }

      await axios.post(`${RAG_SERVICE_URL}/api/ingest`, {
        file_path: filePathForRag,
        file_type: doc.file_type,
        document_id: doc.id
      });
      await db.query("UPDATE documents SET status = 'READY' WHERE id = $1", [doc.id]);
      doc.status = 'READY';
    } catch (ingestError) {
      console.error('Ingestion failed for doc', doc.id, ingestError.message);
      await db.query("UPDATE documents SET status = 'FAILED' WHERE id = $1", [doc.id]);
      doc.status = 'FAILED';
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

const listDocuments = async (req, res, next) => {
  try {
    const documents = await documentService.getAllDocuments();
    res.status(200).json({ documents });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await documentService.deleteDocument(id);
    res.status(200).json({
      message: 'Document deleted successfully',
      document: deleted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  deleteDocument
};
