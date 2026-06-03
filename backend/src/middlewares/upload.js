// Importation du module natif Node.js pour la gestion des chemins de fichiers (path.join, path.extname, etc.)
const path = require("node:path");
// Importation du module natif Node.js pour les opérations sur le système de fichiers (mkdirSync)
const fs = require("node:fs");

// Importation de multer, le middleware Express spécialisé dans la gestion des uploads multipart/form-data
const multer = require("multer");

// Taille maximale autorisée pour tout fichier uploadé : 2 Mo exprimé en octets (2 * 1024 * 1024)
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
// Répertoire racine des uploads, résolu en chemin absolu depuis l'emplacement de ce fichier
// __dirname pointe vers le dossier middlewares/, on remonte de 2 niveaux vers backend/public/uploads
const uploadDir = path.join(__dirname, "../../public/uploads");
// Sous-répertoire dédié aux avatars des utilisateurs, imbriqué dans uploadDir
const avatarUploadDir = path.join(uploadDir, "avatars");
// Ensemble (Set) des types MIME acceptés pour les images générales (articles, médias, builder)
// Set permet une vérification O(1) plus efficace qu'un tableau avec .includes()
const allowedImageMimes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",  // SVG autorisé pour les médias généraux (icônes, illustrations)
  "image/webp",
]);
// Ensemble des types MIME acceptés pour les avatars uniquement
// SVG est exclu ici pour des raisons de sécurité (risque d'injection XSS via SVG malveillant)
const allowedAvatarMimes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

// Création des répertoires d'upload au démarrage du serveur s'ils n'existent pas encore
// L'option { recursive: true } crée toute l'arborescence nécessaire sans erreur si elle existe déjà
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(avatarUploadDir, { recursive: true });

// Configuration du moteur de stockage multer sur disque pour les images générales
const storage = multer.diskStorage({
  // Fonction appelée par multer pour déterminer le répertoire de destination du fichier uploadé
  destination(req, file, callback) {
    // FR: Les fichiers restent dans backend/public pour etre servis statiquement.
    // EN: Files stay under backend/public so Express can serve them statically.
    callback(null, uploadDir); // Premier argument : erreur (null = aucune), deuxième : chemin de destination
  },
  // Fonction appelée par multer pour générer le nom du fichier sur le disque
  filename(req, file, callback) {
    // Extraction de l'extension du fichier original en minuscules pour éviter les contournements de filtre
    const safeExtension = path.extname(file.originalname).toLowerCase();
    // Génération d'un nom unique : timestamp Unix + nombre aléatoire + extension
    // Évite les collisions de noms et empêche de deviner ou prédire les URLs des fichiers uploadés
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, uniqueName);
  },
});

// Filtre de type MIME pour les images générales : rejette tout fichier dont le type n'est pas une image
function fileFilter(req, file, callback) {
  // Vérification que le type MIME déclaré par le client est présent dans l'ensemble autorisé
  // Note : le type MIME peut être falsifié côté client, mais constitue une première ligne de défense
  const isImage = allowedImageMimes.has(file.mimetype);

  // Si le type MIME n'est pas autorisé, on passe une Error à multer (le fichier est rejeté automatiquement)
  if (!isImage) {
    callback(new Error("Seules les images sont autorisees."));
    return;
  }

  // Type MIME valide : on accepte le fichier en passant null (pas d'erreur) et true (fichier accepté)
  callback(null, true);
}

// Filtre de type MIME spécifique aux avatars : vérifie à la fois le MIME et l'extension du fichier
// La double vérification (MIME + extension) renforce la sécurité contre les fichiers masqués
function avatarFileFilter(req, file, callback) {
  // Extraction sécurisée de l'extension du fichier original en minuscules
  const safeExtension = path.extname(file.originalname).toLowerCase();
  // Ensemble des extensions de fichiers autorisées pour les avatars
  const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

  // FR: On refuse SVG pour les avatars tant qu'aucune sanitization SVG dediee n'est en place.
  // EN: SVG avatars are rejected until a dedicated SVG sanitization step exists.
  // Double validation : le type MIME ET l'extension doivent tous deux être dans les listes autorisées
  // Empêche le cas où le MIME est valide mais l'extension est trompeuse (ex: image.php renommé en image.jpg)
  if (!allowedAvatarMimes.has(file.mimetype) || !allowedExtensions.has(safeExtension)) {
    callback(new Error("Avatar invalide. Formats autorises: JPG, PNG, WEBP, 2 Mo maximum."));
    return;
  }

  // Fichier valide pour un avatar : on l'accepte
  callback(null, true);
}

// Instance multer configurée pour l'upload des images générales (articles, médias de blog, etc.)
const uploadImage = multer({
  storage,              // Utilise le moteur de stockage disque configuré ci-dessus
  fileFilter,           // Applique le filtre de type MIME général (accepte SVG)
  limits: {
    fileSize: MAX_UPLOAD_SIZE, // Rejette tout fichier dépassant 2 Mo (protection contre les abus)
  },
});

// Configuration du moteur de stockage multer sur disque spécifique aux avatars utilisateur
const avatarStorage = multer.diskStorage({
  // Les avatars sont stockés dans le sous-répertoire dédié (public/uploads/avatars/)
  destination(req, file, callback) {
    // FR: Les avatars sont regroupes dans un dossier dedie et servi en statique.
    // EN: Avatars are stored in a dedicated statically served folder.
    callback(null, avatarUploadDir); // Destination : sous-dossier avatars
  },
  // Génération d'un nom unique préfixé "avatar-" pour faciliter l'identification et le nettoyage ultérieur
  filename(req, file, callback) {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, uniqueName);
  },
});

// Instance multer configurée pour l'upload des avatars utilisateur
const uploadAvatarImage = multer({
  storage: avatarStorage,     // Utilise le moteur de stockage dédié aux avatars
  fileFilter: avatarFileFilter, // Applique le filtre strict avatars (sans SVG, double vérif)
  limits: {
    fileSize: MAX_UPLOAD_SIZE, // Limite à 2 Mo
  },
});

// Configuration du moteur de stockage multer pour les images du constructeur de pages (builder)
// Les fichiers sont organisés par blog dans des sous-dossiers dédiés pour faciliter la gestion
const builderStorage = multer.diskStorage({
  destination(req, file, callback) {
    // Récupération de l'identifiant du blog depuis les paramètres de l'URL (:blogId)
    const blogId = Number(req.params.blogId);
    // Construction du chemin de destination : public/uploads/blogs/{blogId}/builder/
    // Chaque blog dispose de son propre espace de stockage isolé
    const destination = path.join(uploadDir, "blogs", String(blogId), "builder");
    // Création de l'arborescence complète si elle n'existe pas encore
    fs.mkdirSync(destination, { recursive: true });
    callback(null, destination);
  },
  // Génération d'un nom unique préfixé "builder-" pour différencier ces fichiers des images générales
  filename(req, file, callback) {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `builder-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, uniqueName);
  },
});

// Instance multer configurée pour l'upload des images dans le constructeur de pages (builder)
const uploadBuilderImage = multer({
  storage: builderStorage,  // Utilise le stockage organisé par blog
  fileFilter,               // Réutilise le filtre MIME général (SVG autorisé pour le builder)
  limits: {
    fileSize: MAX_UPLOAD_SIZE, // Limite à 2 Mo
  },
});

// Export de la constante de taille et des trois instances multer
module.exports = {
  MAX_UPLOAD_SIZE,       // Constante exportée pour être réutilisée (ex: validation côté front)
  uploadAvatarImage,     // Middleware pour l'upload des avatars utilisateur
  uploadBuilderImage,    // Middleware pour l'upload des images du builder de pages
  uploadImage,           // Middleware pour l'upload des images générales (articles, médias)
};
