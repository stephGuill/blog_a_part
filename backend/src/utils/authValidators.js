// utils/authValidators.js
// ============================================================
// Fonctions de validation des données d'authentification.
// Utilisées côté backend pour valider les payloads d'inscription
// et de connexion avant tout traitement (hashage, BDD, etc.).
//
// Exports :
//   - EMAIL_PATTERN     : RegExp de validation d'email
//   - PASSWORD_PATTERN  : RegExp de validation de mot de passe fort
//   - USERNAME_PATTERN  : RegExp de validation du pseudo
//   - stripHtml()       : supprime les balises HTML d'une chaîne
//   - validateRegisterPayload(payload) → message d'erreur ou null
//   - validateLoginPayload(payload)    → message d'erreur ou null
// ============================================================

// Regex pour valider un pseudo (username) :
// - entre 3 et 30 caractères
// - uniquement lettres (a-z A-Z), chiffres (0-9), tiret (-) ou underscore (_)
// - ^ et $ ancrent le pattern au début et à la fin de la chaîne
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

// Regex simplifiée pour valider une adresse email :
// - format attendu : quelquechose@domaine.extension
// - [^\s@]+ : un ou plusieurs caractères qui ne sont pas un espace ni un @
// - Cette regex est volontairement simple (validation stricte côté BDD ensuite)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Regex pour valider un mot de passe fort :
// - (?=.*[a-z])      : au moins une lettre minuscule (lookahead)
// - (?=.*[A-Z])      : au moins une lettre majuscule (lookahead)
// - (?=.*\d)         : au moins un chiffre (lookahead)
// - (?=.*[^A-Za-z\d]): au moins un caractère spécial non-alphanumérique (lookahead)
// - .{8,}            : au moins 8 caractères au total
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

// Supprime toutes les balises HTML d'une valeur texte pour prévenir les injections XSS.
// - Convertit la valeur en String pour traiter null/undefined sans erreur
// - Utilise une regex qui correspond à tout ce qui est entre < et > (balise HTML)
// - .trim() supprime les espaces en début et fin de chaîne
function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, "").trim();
}

// Valide le payload d'inscription envoyé par le formulaire de création de compte.
// Retourne null si tout est valide, ou une chaîne de message d'erreur sinon.
// Les vérifications sont effectuées dans l'ordre de priorité UI/UX.
function validateRegisterPayload(payload) {
  // Nettoyage du pseudo : suppression des balises HTML puis trim
  const username = stripHtml(payload.username);

  // Nettoyage de l'email : suppression HTML, trim, puis mise en minuscules
  // (normalisation pour éviter les doublons "User@Test.com" / "user@test.com")
  const email = stripHtml(payload.email).toLowerCase();

  // Conversion explicite en String pour éviter les erreurs si payload.password est undefined/null
  const password = String(payload.password || "");

  // Supporte les deux noms de champ : confirmPassword (camelCase) ou confirm_password (snake_case)
  const confirmPassword = String(payload.confirmPassword || payload.confirm_password || "");

  // Vérification du format du pseudo avec la regex USERNAME_PATTERN
  // Si le pseudo ne correspond pas, on retourne le message d'erreur correspondant
  if (!USERNAME_PATTERN.test(username)) {
    return "Le pseudo doit contenir 3 à 30 caractères : lettres, chiffres, tiret ou underscore.";
  }

  // Vérification du format de l'email ET de sa longueur maximale (191 chars)
  // La limite 191 correspond à la longueur max d'un index MySQL utf8mb4 (255 × 0.75)
  if (!EMAIL_PATTERN.test(email) || email.length > 191) {
    return "Adresse email invalide.";
  }

  // Vérification qu'il n'y a pas d'espace autour du mot de passe :
  // password.trim() !== password signifie qu'il y a au moins un espace en début/fin
  if (password.trim() !== password) {
    return "Le mot de passe ne doit pas commencer ou finir par un espace.";
  }

  // Vérification du format du mot de passe avec la regex PASSWORD_PATTERN (complexité minimale)
  if (!PASSWORD_PATTERN.test(password)) {
    return "Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial.";
  }

  // Vérification que la confirmation de mot de passe est présente et correspond au mot de passe
  if (!confirmPassword || password !== confirmPassword) {
    return "La confirmation du mot de passe ne correspond pas.";
  }

  // Toutes les vérifications ont réussi : retourne null (pas d'erreur)
  return null;
}

// Valide le payload de connexion envoyé par le formulaire de login.
// Retourne null si tout est valide, ou une chaîne de message d'erreur sinon.
function validateLoginPayload(payload) {
  // Nettoyage de l'identifiant (peut être un email ou un username)
  // Supporte les deux noms de champ : identifier (générique) ou login (alternatif)
  const identifier = stripHtml(payload.identifier || payload.login);

  // Conversion explicite du mot de passe en String
  const password = String(payload.password || "");

  // Vérification basique de l'identifiant :
  // - ne doit pas être vide (!identifier)
  // - ne doit pas dépasser 191 caractères (longueur max index MySQL)
  // - ne doit pas contenir < ou > (protection XSS supplémentaire)
  if (!identifier || identifier.length > 191 || /<|>/.test(identifier)) {
    return "Identifiant invalide.";
  }

  // Le mot de passe ne doit pas être vide (validation minimale côté serveur)
  if (!password) {
    return "Mot de passe obligatoire.";
  }

  // Payload valide : retourne null (pas d'erreur)
  return null;
}

// Export des patterns et des fonctions de validation pour utilisation
// dans les controllers d'authentification et les tests unitaires.
module.exports = {
  EMAIL_PATTERN,       // RegExp d'email, réutilisable dans d'autres modules
  PASSWORD_PATTERN,    // RegExp de mot de passe fort
  USERNAME_PATTERN,    // RegExp de pseudo
  stripHtml,           // Sanitizer HTML basique
  validateLoginPayload,    // Validateur de formulaire de connexion
  validateRegisterPayload, // Validateur de formulaire d'inscription
};
