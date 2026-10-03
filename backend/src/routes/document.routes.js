const express = require('express');
const documentController = require('../controllers/document.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

const router = express.Router();

// POST / - Upload document (Admin only)
router.post('/', verifyToken, requireRole('ADMIN'), upload.single('file'), documentController.uploadDocument);

// GET / - List all documents (Admin and Employee)
router.get('/', verifyToken, documentController.listDocuments);

// DELETE /:id - Delete document (Admin only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), documentController.deleteDocument);

module.exports = router;
