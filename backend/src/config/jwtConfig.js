// config/jwtConfig.js
// ============================================================
// Configuration des tokens JWT (JSON Web Token) utilisés pour
// l'authentification des utilisateurs.
//
// JWT = JSON Web Token : standard ouvert (RFC 7519) permettant
// d'échanger des informations de façon sécurisée entre parties
// sous forme d'objet JSON signé numériquement.
//
// Structure d'un JWT : header.payload.signature
//   - header   : algorithme de signature (ex: HS256)
//   - payload  : données (userId, role, expiration...)
//   - signature: HMAC du header+payload avec jwtSecret
//
// NOTE DE SÉCURITÉ : En production, JWT_SECRET DOIT être défini
// dans les variables d'environnement avec une valeur longue et
// aléatoire (au moins 256 bits). Ne jamais committer le secret
// dans le dépôt Git.
// ============================================================

// Clé secrète utilisée pour signer les tokens JWT côté serveur.
// Cette clé doit rester strictement confidentielle : quiconque la
// possède peut forger des tokens valides et usurper n'importe quel compte.
// Utilise la variable d'environnement JWT_SECRET si définie,
// sinon utilise la valeur par défaut (UNIQUEMENT pour le développement local).
const jwtSecret = process.env.JWT_SECRET || "change-me-in-production";

// Durée de validité d'un token JWT après sa création.
// Format compris par la librairie jsonwebtoken : "2h" (2 heures), "7d" (7 jours), etc.
// Après expiration, le token est rejeté et l'utilisateur doit se reconnecter.
// Utilise JWT_EXPIRES_IN si défini, sinon 2 heures par défaut.
// Valeur courte recommandée en production pour limiter la fenêtre d'exploitation
// en cas de vol de token.
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "2h";

// Export de la configuration JWT pour utilisation dans les services d'authentification.
// Ces valeurs sont importées par AuthService.js pour signer (jwt.sign) et
// vérifier (jwt.verify) les tokens.
module.exports = {
  jwtSecret,    // Clé de signature (garder secrète !)
  jwtExpiresIn, // Durée de validité du token
};
