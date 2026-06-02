const path = require("node:path");
const fs = require("node:fs");

const multer = require("multer");

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
const uploadDir = path.join(__dirname, "../../public/uploads");
const avatarUploadDir = path.join(uploadDir, "avatars");
const allowedImageMimes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);
const allowedAvatarMimes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(avatarUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, callback) {
    // FR: Les fichiers restent dans backend/public pour etre servis statiquement.
    // EN: Files stay under backend/public so Express can serve them statically.
    callback(null, uploadDir);
  },
  filename(req, file, callback) {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, uniqueName);
  },
});

function fileFilter(req, file, callback) {
  const isImage = allowedImageMimes.has(file.mimetype);

  if (!isImage) {
    callback(new Error("Seules les images sont autorisees."));
    return;
  }

  callback(null, true);
}

function avatarFileFilter(req, file, callback) {
  const safeExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

  // FR: On refuse SVG pour les avatars tant qu'aucune sanitization SVG dediee n'est en place.
  // EN: SVG avatars are rejected until a dedicated SVG sanitization step exists.
  if (!allowedAvatarMimes.has(file.mimetype) || !allowedExtensions.has(safeExtension)) {
    callback(new Error("Avatar invalide. Formats autorises: JPG, PNG, WEBP, 2 Mo maximum."));
    return;
  }

  callback(null, true);
}

const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
});

const avatarStorage = multer.diskStorage({
  destination(req, file, callback) {
    // FR: Les avatars sont regroupes dans un dossier dedie et servi en statique.
    // EN: Avatars are stored in a dedicated statically served folder.
    callback(null, avatarUploadDir);
  },
  filename(req, file, callback) {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, uniqueName);
  },
});

const uploadAvatarImage = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
});

const builderStorage = multer.diskStorage({
  destination(req, file, callback) {
    const blogId = Number(req.params.blogId);
    const destination = path.join(uploadDir, "blogs", String(blogId), "builder");
    fs.mkdirSync(destination, { recursive: true });
    callback(null, destination);
  },
  filename(req, file, callback) {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `builder-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, uniqueName);
  },
});

const uploadBuilderImage = multer({
  storage: builderStorage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
});

module.exports = {
  MAX_UPLOAD_SIZE,
  uploadAvatarImage,
  uploadBuilderImage,
  uploadImage,
};
