/**
 * Wraps an async Express route handler so that any unhandled promise rejection
 * is forwarded to the next() error-handling middleware instead of crashing the server.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
