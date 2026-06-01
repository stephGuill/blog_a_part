// FR: Configuration sécurisée pour JWT.
// EN: Secure JWT configuration.
const jwtSecret = process.env.JWT_SECRET || "change-me-in-production";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "2h";

module.exports = {
  jwtSecret,
  jwtExpiresIn
};
