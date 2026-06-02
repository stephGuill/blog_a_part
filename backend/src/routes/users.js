// Router: User-related endpoints (profile management, avatar uploads, admin operations)
// - Protects routes with `protect` and restricts admin-only endpoints with `restrictTo('admin')`.
// - Middlewares used: `isSelfOrAdmin` (allow self or admin), `uploadImage` for avatars.
const express = require("express");
// Controller avec la logique CRUD pour les utilisateurs
const usersController = require("../controllers/usersController");
// Middleware d'authentification et de contrôle de rôle
const { protect, restrictTo } = require("../middlewares/auth");
// Middleware utilitaire : autorise l'accès si l'utilisateur est la cible ou un admin
const { isSelfOrAdmin } = require("../middlewares/permissions");
// Multer wrapper pour l'upload d'images
const { uploadImage } = require("../middlewares/upload");

const router = express.Router();

// GET /users/ -> liste des utilisateurs (admin seulement)
router.get("/", protect, restrictTo("admin"), usersController.browse);

// GET /users/:id -> lecture d'un utilisateur
// Accessible si la requête est de l'utilisateur lui-même ou par un admin
router.get("/:id", protect, isSelfOrAdmin, usersController.read);

// PUT /users/:id -> mise à jour complète du profil (utilisateur lui-même ou admin)
router.put("/:id", protect, isSelfOrAdmin, usersController.edit);

// PATCH /users/:id/avatar -> upload d'avatar (multipart/form-data)
// Utilise `uploadImage.single('avatar')` qui expose `req.file` au controller
router.patch("/:id/avatar", protect, isSelfOrAdmin, uploadImage.single("avatar"), usersController.uploadAvatar);

// PATCH /users/:id/active -> activer/désactiver un compte (admin seulement)
router.patch("/:id/active", protect, restrictTo("admin"), usersController.toggleActive);

// POST /users/ -> créer un utilisateur (admin seulement)
router.post("/", protect, restrictTo("admin"), usersController.add);

// DELETE /users/:id -> suppression d'un utilisateur (admin seulement)
router.delete("/:id", protect, restrictTo("admin"), usersController.destroy);

module.exports = router;
