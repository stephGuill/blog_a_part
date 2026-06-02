const rateLimit = require("express-rate-limit");

const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const authRateLimitMaxRequests = Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 10);

// FR: Limite les tentatives d'authentification pour reduire le brute force.
// EN: Limits authentication attempts to reduce brute-force attacks.
const authLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: authRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Trop de tentatives. Reessayez dans quelques minutes.",
  },
});

module.exports = {
  authLimiter,
};
