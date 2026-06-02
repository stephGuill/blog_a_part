// Validation helpers for authentication payloads
// - Patterns exported for reuse in tests/clients
// - Helpers: stripHtml(), validateRegisterPayload(payload), validateLoginPayload(payload)
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, "").trim();
}

function validateRegisterPayload(payload) {
  const username = stripHtml(payload.username);
  const email = stripHtml(payload.email).toLowerCase();
  const password = String(payload.password || "");
  const confirmPassword = String(payload.confirmPassword || payload.confirm_password || "");

  if (!USERNAME_PATTERN.test(username)) {
    return "Le pseudo doit contenir 3 à 30 caractères : lettres, chiffres, tiret ou underscore.";
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 191) {
    return "Adresse email invalide.";
  }

  if (password.trim() !== password) {
    return "Le mot de passe ne doit pas commencer ou finir par un espace.";
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return "Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial.";
  }

  if (!confirmPassword || password !== confirmPassword) {
    return "La confirmation du mot de passe ne correspond pas.";
  }

  return null;
}

function validateLoginPayload(payload) {
  const identifier = stripHtml(payload.identifier || payload.login);
  const password = String(payload.password || "");

  if (!identifier || identifier.length > 191 || /<|>/.test(identifier)) {
    return "Identifiant invalide.";
  }

  if (!password) {
    return "Mot de passe obligatoire.";
  }

  return null;
}

module.exports = {
  EMAIL_PATTERN,
  PASSWORD_PATTERN,
  USERNAME_PATTERN,
  stripHtml,
  validateLoginPayload,
  validateRegisterPayload,
};
