const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  // Always log the full stack trace server-side (never sent to client)
  console.error(err.stack);

  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    let message = err.message;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum file size is 10MB.';
    }

    return res.status(400).json({ error: message });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
