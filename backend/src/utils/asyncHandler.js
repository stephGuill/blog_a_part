// Wrap async express handlers and forward errors to `next`.
// Usage: router.get('/route', asyncHandler(async (req,res)=>{ ... }));
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
