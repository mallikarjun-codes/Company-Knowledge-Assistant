const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err.message);

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
