const fs = require('fs').promises;
const db = require('../config/db');

const createDocument = async ({ filename, originalName, fileType, fileSize, filePath, uploadedBy }) => {
  const insertQuery = `
    INSERT INTO documents (filename, original_name, file_type, file_size, file_path, uploaded_by, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
    RETURNING *;
  `;
  const result = await db.query(insertQuery, [filename, originalName, fileType, fileSize, filePath, uploadedBy]);
  return result.rows[0];
};

const getAllDocuments = async () => {
  const query = `
    SELECT d.*, u.name AS uploader_name
    FROM documents d
    JOIN users u ON d.uploaded_by = u.id
    ORDER BY d.created_at DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

const getDocumentById = async (id) => {
  const query = 'SELECT * FROM documents WHERE id = $1';
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

const deleteDocument = async (id) => {
  // Fetch the document first to get the file path
  const doc = await getDocumentById(id);
  if (!doc) {
    const error = new Error('Document not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete from database
  await db.query('DELETE FROM documents WHERE id = $1', [id]);

  // Remove file from disk
  try {
    await fs.unlink(doc.file_path);
  } catch (err) {
    // Log but don't throw if file is already gone
    console.error(`Warning: Could not delete file at ${doc.file_path}:`, err.message);
  }

  return doc;
};

module.exports = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument
};
