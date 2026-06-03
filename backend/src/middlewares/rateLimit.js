// Importation du module express-rate-limit pour limiter le débit de requêtes par adresse IP
// Permet de se protéger contre les attaques par force brute et les abus d'API
const rateLimit = require("express-rate-limit");

// Durée de la fenêtre glissante en millisecondes pendant laquelle les requêtes sont comptabilisées
// Valeur par défaut : 15 minutes (15 * 60 * 1000 = 900 000 ms) si la variable d'env n'est pas définie
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);

// Nombre maximum de requêtes autorisées par IP dans la fenêtre de temps définie ci-dessus
// Valeur par défaut : 10 tentatives si la variable d'environnement n'est pas définie
// Configurable via .env pour adapter le seuil selon l'environnement (dev vs prod)
const authRateLimitMaxRequests = Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 10);

// FR: Limite les tentatives d'authentification pour reduire le brute force.
// EN: Limits authentication attempts to reduce brute-force attacks.
// Création du limiteur de débit dédié aux routes d'authentification (login, register, reset password, etc.)
const authLimiter = rateLimit({
  // Fenêtre de temps dans laquelle les requêtes d'une même IP sont comptabilisées
  windowMs: rateLimitWindowMs,
  // Nombre maximum de requêtes autorisées par IP pendant la fenêtre de temps
  max: authRateLimitMaxRequests,
  // Activation des en-têtes HTTP standard RateLimit (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
  // Ces en-têtes informent le client sur ses limites restantes selon la RFC 6585
  standardHeaders: true,
  // Désactivation des anciens en-têtes X-RateLimit-* (format non standardisé, désormais obsolète)
  legacyHeaders: false,
  // Message de réponse retourné au client (HTTP 429 Too Many Requests) lorsque la limite est dépassée
  message: {
    status: "fail",
    message: "Trop de tentatives. Reessayez dans quelques minutes.",
  },
});

// Export du limiteur pour l'appliquer sur les routes d'authentification dans les fichiers de routes
module.exports = {
  authLimiter,
};
