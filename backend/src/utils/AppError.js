// utils/AppError.js
// ============================================================
// Classe d'erreur personnalisée pour les erreurs HTTP applicatives.
// Hérite de la classe native Error de JavaScript pour être
// interceptable par les middlewares Express de gestion d'erreurs.
//
// Utilisation :
//   throw new AppError("Ressource introuvable", 404, "fail");
//   throw new AppError("Erreur interne", 500);
// ============================================================

// Déclaration de la classe AppError qui étend Error (la classe d'erreur native JS).
// Cela permet de l'utiliser avec try/catch et d'être reconnu comme une instance d'Error.
class AppError extends Error {
  // Constructeur : appelé à chaque `new AppError(...)`
  // - message    : texte décrivant l'erreur (transmis à la réponse JSON)
  // - statusCode : code HTTP à retourner (ex: 400=BadRequest, 404=NotFound, 500=ServerError)
  //                Par défaut 500 si non spécifié.
  // - status     : étiquette courte pour catégoriser l'erreur dans la réponse JSON.
  //                Convention REST : "fail" pour erreurs client (4xx), "error" pour serveur (5xx).
  //                Par défaut "error".
  constructor(message, statusCode = 500, status = "error") {
    // Appel du constructeur parent Error avec le message.
    // Cela initialise this.message et this.stack (trace d'appel) automatiquement.
    super(message);

    // Stockage du statut textuel sur l'instance pour être lisible par les middlewares.
    this.status = status;

    // Stockage du code HTTP pour que le middleware d'erreur puisse
    // appeler res.status(err.statusCode) sans avoir à le déduire.
    this.statusCode = statusCode;
  }
}

// Export de la classe pour utilisation dans les controllers, services et middlewares.
module.exports = AppError;
