const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err.message);

  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    let message = err.message;
    let statusCode = 400;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum file size is 10MB.';
    }

    return res.status(statusCode).json({
      error: { message }
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message: message,
      // Do not expose stack traces to the client for security reasons
    }
  });
};

module.exports = errorHandler;

