// Router: Media management endpoints
// - Handles listing, reading, uploading and deleting media files
// - Uploads are handled via the `uploadImage` middleware which exposes `req.file`
const express = require('express')

// Controller pour la gestion des médias (fichiers uploadés)
const mediaController = require("../controllers/mediaController");
// Protection par JWT/session et contrôle des rôles
const { protect, restrictTo } = require("../middlewares/auth");
// Multer wrapper pour l'upload d'images/fichiers
const { uploadImage } = require("../middlewares/upload");


const router = express.Router();
// ROUTES MEDIA
// Les routes media nécessitent généralement des permissions spécifiques
// (admin/owner/editor) selon l'opération.

// GET /media -> liste des médias (roles admin/owner/editor)
router.get("/", protect, restrictTo("admin", "owner", "editor"), mediaController.browse);

// GET /media/:id -> lecture d'un média
router.get("/:id", protect, restrictTo("admin", "owner", "editor"), mediaController.read);

// PUT /media/:id -> mise à jour des métadonnées (owner/admin)
router.put("/:id", protect, restrictTo("admin", "owner"), mediaController.edit);

// POST /media -> upload d'un fichier (multipart/form-data, champ 'file')
// Utilise `uploadImage.single('file')` pour exposer `req.file` au controller
router.post("/", protect, restrictTo("admin", "owner", "editor"), uploadImage.single("file"), mediaController.add);

// DELETE /media/:id -> suppression (owner/admin)
router.delete("/:id", protect, restrictTo("admin", "owner"), mediaController.destroy);

module.exports = router;
