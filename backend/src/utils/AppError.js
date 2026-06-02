// Lightweight error class for HTTP-style errors
// - message : texte d'erreur
// - statusCode : code HTTP (ex: 400, 404, 500)
// - status : étiquette courte ('error'|'fail') utile pour les réponses JSON standardisées
class AppError extends Error {
  constructor(message, statusCode = 500, status = "error") {
    super(message);
    this.status = status;
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
