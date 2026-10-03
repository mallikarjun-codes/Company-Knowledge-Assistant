const multer = require('multer');
const path = require('path');

// Allowed file extensions and their MIME types
const ALLOWED_FILE_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_FILE_TYPES);
const ALLOWED_MIMES = Object.values(ALLOWED_FILE_TYPES);

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to restrict allowed file types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIMES.includes(mime)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
