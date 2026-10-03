const documentService = require('../services/document.service');

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
