// utils/twoFactor.js
// ============================================================
// Implémentation de l'authentification à deux facteurs (2FA) via TOTP.
// TOTP = Time-based One-Time Password (RFC 6238).
//
// Le TOTP génère un code à 6 chiffres qui change toutes les 30 secondes,
// basé sur un secret partagé entre le serveur et l'application 2FA
// (ex: Google Authenticator, Authy).
//
// Algorithme :
//   1. Le secret est encodé en Base32 (compatible avec les apps 2FA)
//   2. Un compteur de temps (timestamp / 30 secondes) est haché avec HMAC-SHA1
//   3. Un code numérique est extrait du hash par troncation dynamique
//
// Exports :
//   - generateSecret()                        : génère un nouveau secret Base32
//   - generateTotp(secret, ...)               : calcule le code TOTP actuel
//   - verifyTotp(secret, code, window)         : vérifie un code avec tolérance de temps
//   - createOtpAuthUrl({secret, email, issuer}): génère l'URL otpauth pour QR code
//   - generateRecoveryCodes(count)            : génère des codes de récupération
// ============================================================

// Module natif de Node.js pour les opérations cryptographiques :
// utilisé ici pour HMAC-SHA1 et la génération de bytes aléatoires.
const crypto = require("node:crypto");

// Alphabet Base32 standard (RFC 4648) : 26 lettres majuscules + chiffres 2-7.
// Les chiffres 0, 1, 8, 9 sont exclus pour éviter la confusion visuelle
// (0/O, 1/I/l, 8/B, etc.).
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// ---------------------------------------------------------------
// base32Encode(buffer)
// Encode un Buffer binaire en chaîne Base32.
// Utilisé pour transformer les bytes aléatoires du secret en une
// chaîne lisible compatible avec les applications d'authentification.
// ---------------------------------------------------------------
function base32Encode(buffer) {
  // Conversion de chaque octet du buffer en sa représentation binaire sur 8 bits.
  // padStart(8, "0") garantit que chaque octet est représenté avec exactement 8 bits
  // (ex: l'octet 5 → "00000101" et non "101").
  let bits = "";
  let output = "";

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  // Découpage de la chaîne binaire en groupes de 5 bits (Base32 = 5 bits par caractère).
  // padEnd(5, "0") complète le dernier groupe si sa longueur est inférieure à 5.
  // parseInt(chunk, 2) convertit les 5 bits en nombre décimal (0-31) pour l'indexer dans l'alphabet.
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  return output;
}

// ---------------------------------------------------------------
// base32Decode(secret)
// Décode une chaîne Base32 en Buffer binaire.
// Utilisé pour reconvertir le secret stocké en bytes avant le calcul HMAC.
// ---------------------------------------------------------------
function base32Decode(secret) {
  // Normalisation du secret : suppression des '=' de padding et des espaces,
  // puis conversion en majuscules pour être insensible à la casse.
  const cleanSecret = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";

  // Pour chaque caractère du secret Base32, on cherche son index dans l'alphabet.
  // Cet index (0-31) est converti en binaire sur 5 bits et ajouté à la chaîne.
  // Si un caractère n'est pas dans l'alphabet, on lève une erreur explicite.
  for (const character of cleanSecret) {
    const value = BASE32_ALPHABET.indexOf(character);
    if (value < 0) throw new Error("INVALID_BASE32_SECRET");
    bits += value.toString(2).padStart(5, "0");
  }

  // Regroupement des bits en octets (8 bits) et conversion en tableau d'entiers.
  // Les bits restants (< 8) en fin de chaîne sont ignorés (padding naturel Base32).
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  // Création d'un Buffer Node.js à partir du tableau d'octets.
  return Buffer.from(bytes);
}

// ---------------------------------------------------------------
// generateSecret()
// Génère un nouveau secret TOTP aléatoire de 20 octets (160 bits),
// encodé en Base32 pour être compatible avec les apps d'authentification.
// 20 octets = longueur recommandée par la RFC 6238 pour les secrets TOTP.
// ---------------------------------------------------------------
function generateSecret() {
  // crypto.randomBytes(20) génère 20 octets cryptographiquement aléatoires
  // (utilise /dev/urandom ou l'API équivalente selon l'OS).
  return base32Encode(crypto.randomBytes(20));
}

// ---------------------------------------------------------------
// generateTotp(secret, timeStep, digits, timestamp)
// Calcule le code TOTP pour un instant donné.
// Paramètres :
//   - secret    : secret Base32 partagé
//   - timeStep  : durée de validité d'un code en secondes (défaut: 30)
//   - digits    : nombre de chiffres du code (défaut: 6)
//   - timestamp : horodatage en millisecondes (défaut: Date.now())
// ---------------------------------------------------------------
function generateTotp(secret, timeStep = 30, digits = 6, timestamp = Date.now()) {
  // Calcul du compteur TOTP : nombre d'intervalles de 30s écoulés depuis l'epoch Unix.
  // Math.floor() tronque à l'entier inférieur (le compteur change toutes les 30s).
  const counter = Math.floor(timestamp / 1000 / timeStep);

  // Création d'un buffer de 8 octets (64 bits) pour stocker le compteur.
  // HOTP/TOTP utilise un compteur 64 bits en big-endian (octet le plus significatif en premier).
  const counterBuffer = Buffer.alloc(8);

  // Les 4 octets de poids fort sont mis à 0 (le compteur tient sur 32 bits pour les 100 prochaines années).
  counterBuffer.writeUInt32BE(0, 0);

  // Les 4 octets de poids faible contiennent la valeur réelle du compteur.
  counterBuffer.writeUInt32BE(counter, 4);

  // Calcul du HMAC-SHA1 du compteur avec le secret comme clé.
  // HMAC (Hash-based Message Authentication Code) produit un hash de 20 octets.
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();

  // Troncation dynamique (RFC 4226, section 5.4) :
  // L'offset est déterminé par les 4 bits de poids faible du dernier octet du HMAC.
  const offset = hmac[hmac.length - 1] & 0x0f;

  // Extraction de 4 octets à partir de l'offset, avec masquage du bit de signe
  // (& 0x7f sur le premier octet) pour obtenir un entier 31 bits non signé.
  const binary =
    ((hmac[offset] & 0x7f) << 24) |      // Octet de poids fort (bit de signe masqué)
    ((hmac[offset + 1] & 0xff) << 16) |  // Deuxième octet
    ((hmac[offset + 2] & 0xff) << 8) |   // Troisième octet
    (hmac[offset + 3] & 0xff);           // Octet de poids faible

  // Modulo 10^digits pour obtenir le code à N chiffres.
  // padStart(digits, "0") ajoute des zéros en tête si le code est inférieur
  // à 10^(digits-1) (ex: code "42" → "000042" pour 6 chiffres).
  return String(binary % 10 ** digits).padStart(digits, "0");
}

// ---------------------------------------------------------------
// verifyTotp(secret, code, window)
// Vérifie si un code TOTP fourni par l'utilisateur est valide.
// Paramètres :
//   - secret : secret Base32 partagé
//   - code   : code soumis par l'utilisateur (chaîne ou nombre)
//   - window : tolérance en nombre d'intervalles de ±30s (défaut: 1)
//              Permet de compenser les légères désynchronisations d'horloge.
// ---------------------------------------------------------------
function verifyTotp(secret, code, window = 1) {
  // Normalisation du code : conversion en chaîne, suppression des espaces.
  const cleanCode = String(code || "").trim();

  // Vérification du format : doit être exactement 6 chiffres.
  // Rejet immédiat si le format est invalide (évite des calculs inutiles).
  if (!/^\d{6}$/.test(cleanCode)) {
    return false;
  }

  // Itération sur la fenêtre de tolérance : on vérifie le code pour
  // chaque intervalle de temps dans [-window, +window].
  // window=1 vérifie 3 codes : l'intervalle précédent, l'actuel, et le suivant.
  // Cela permet une tolérance de ±30 secondes par rapport à l'horloge serveur.
  for (let step = -window; step <= window; step += 1) {
    // Calcul du timestamp décalé : ajout de step * 30s en millisecondes.
    const timestamp = Date.now() + step * 30 * 1000;

    // Si le code correspond à l'un des intervalles, la validation réussit.
    if (generateTotp(secret, 30, 6, timestamp) === cleanCode) {
      return true;
    }
  }

  // Aucun code ne correspond : retourne false (code invalide ou expiré).
  return false;
}

// ---------------------------------------------------------------
// createOtpAuthUrl({ secret, email, issuer })
// Génère l'URL otpauth:// standard pour créer un QR code scannable
// par les applications d'authentification (Google Authenticator, etc.).
// Format : otpauth://totp/Issuer:email?secret=...&issuer=...&algorithm=SHA1&digits=6&period=30
// ---------------------------------------------------------------
function createOtpAuthUrl({ secret, email, issuer = "BlogYoo" }) {
  // encodeURIComponent() encode les caractères spéciaux pour une URL valide
  // (espaces, @, etc. dans l'email et le nom de l'issuer).
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ---------------------------------------------------------------
// generateRecoveryCodes(count)
// Génère des codes de récupération pour la 2FA.
// Ces codes permettent à l'utilisateur de se connecter si il perd
// accès à son application d'authentification.
// Chaque code est composé de 5 octets aléatoires en hexadécimal majuscule
// (ex: "A3F2B81C9E"), soit 10 caractères uniques.
// ---------------------------------------------------------------
function generateRecoveryCodes(count = 8) {
  // Array.from({ length: count }) crée un tableau de `count` éléments.
  // Pour chaque élément, on génère 5 octets aléatoires (40 bits d'entropie par code).
  // .toString("hex") convertit les octets en chaîne hexadécimale.
  // .toUpperCase() pour une meilleure lisibilité.
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString("hex").toUpperCase());
}

// Export des fonctions publiques.
// generateTotp et base32Encode/Decode sont des fonctions internes non exportées.
module.exports = {
  createOtpAuthUrl,    // Génération d'URL QR code pour les apps 2FA
  generateRecoveryCodes, // Génération de codes de récupération one-time
  generateSecret,      // Génération d'un nouveau secret TOTP
  verifyTotp,          // Vérification d'un code TOTP soumis par l'utilisateur
};
