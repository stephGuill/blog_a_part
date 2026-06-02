// jwtConfig.js
// Configuration minimale pour les tokens JWT utilisés par le backend.
// Ce fichier exporte la `jwtSecret` et la durée d'expiration `jwtExpiresIn`.
// NOTE: En production, assurez-vous de définir `JWT_SECRET` via une variable
// d'environnement sécurisée et non commitée dans le dépôt.

// Clé secrète utilisée pour signer les tokens JWT
const jwtSecret = process.env.JWT_SECRET || "change-me-in-production";

// Durée de validité du token, format compréhensible par la librairie JWT (ex: '2h')
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "2h";

// Exporter la configuration pour être utilisée par les services d'authentification
module.exports = {
  jwtSecret,
  jwtExpiresIn,
};
